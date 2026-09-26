import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, statSync, copyFileSync, writeFileSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// Pin the build, never select a moving "latest" release at install time.
export const LLAMA_RELEASE = "b11168";
const ROOT = "https://github.com/ggml-org/llama.cpp/releases/download/";
const ASSETS = [
  { name: `llama-${LLAMA_RELEASE}-bin-win-cpu-x64.zip`, backend: "cpu" },
  { name: `llama-${LLAMA_RELEASE}-bin-win-cuda-12.4-x64.zip`, backend: "cuda" },
  { name: "cudart-llama-bin-win-cuda-12.4-x64.zip", backend: "cuda" },
];

export function validateAssets(release) {
  if (release.tag_name !== LLAMA_RELEASE || release.draft) throw new Error("Unexpected llama.cpp release");
  return ASSETS.map(({ name, backend }) => {
    const asset = release.assets?.find((candidate) => candidate.name === name);
    if (!asset || asset.browser_download_url !== `${ROOT}${LLAMA_RELEASE}/${name}`
      || !/^sha256:[a-f0-9]{64}$/.test(asset.digest ?? "")
      || !Number.isSafeInteger(asset.size) || asset.size < 1000 || asset.size > 1_500_000_000) {
      throw new Error(`Missing or unverifiable llama.cpp asset: ${name}`);
    }
    return { ...asset, backend };
  });
}

async function get(url) {
  const response = await fetch(url, { headers: { "User-Agent": "Helix-Windows-Installer", "Accept": "application/vnd.github+json" } });
  if (!response.ok) throw new Error(`Upstream release unavailable (HTTP ${response.status})`);
  return response;
}

function filesBelow(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

export async function prepareLlamaBundle() {
  if (process.platform !== "win32") throw new Error("Build the Windows llama.cpp bundle on Windows");
  const release = await (await get(`https://api.github.com/repos/ggml-org/llama.cpp/releases/tags/${LLAMA_RELEASE}`)).json();
  const assets = validateAssets(release);
  mkdirSync(resolve(".runtime"), { recursive: true });
  const stage = mkdtempSync(resolve(".runtime/llama-stage-"));
  const bundle = resolve(".runtime/llama");
  const prepared = join(stage, "bundle");
  mkdirSync(prepared);
  for (const backend of ["cpu", "cuda"]) mkdirSync(join(prepared, backend));
  try {
    const provenance = [];
    for (const asset of assets) {
      const archive = join(stage, asset.name);
      const response = await get(asset.browser_download_url);
      if (!response.body) throw new Error("Empty llama.cpp download");
      await pipeline(Readable.fromWeb(response.body), createWriteStream(archive));
      const hash = createHash("sha256");
      for await (const part of createReadStream(archive)) hash.update(part);
      if (statSync(archive).size !== asset.size || hash.digest("hex") !== asset.digest.slice(7)) {
        throw new Error(`Checksum mismatch: ${asset.name}`);
      }
      const destination = join(stage, `extracted-${provenance.length}`);
      mkdirSync(destination);
      execFileSync("tar", ["-xf", archive, "-C", destination], { stdio: "inherit" });
      for (const path of filesBelow(destination)) {
        if (!/\.(exe|dll)$/i.test(path)) continue;
        if (basename(path).toLowerCase() !== "llama-server.exe" && !path.toLowerCase().endsWith(".dll")) continue;
        const target = join(prepared, asset.backend, basename(path));
        if (existsSync(target)) throw new Error(`Duplicate library in upstream archive: ${basename(path)}`);
        copyFileSync(path, target);
      }
      provenance.push({ file: asset.name, backend: asset.backend, bytes: asset.size, digest: asset.digest });
    }
    for (const backend of ["cpu", "cuda"]) {
      if (!existsSync(join(prepared, backend, "llama-server.exe"))) {
        throw new Error(`${backend} llama-server.exe missing in verified release`);
      }
    }
    const license = await (await get(`https://raw.githubusercontent.com/ggml-org/llama.cpp/${LLAMA_RELEASE}/LICENSE`)).text();
    if (!license.includes("MIT License") || license.length > 100_000) throw new Error("Missing llama.cpp MIT license");
    writeFileSync(join(prepared, "LICENSE-llama.cpp.txt"), license);
    writeFileSync(join(prepared, "PROVENANCE.json"), JSON.stringify({ owner: "ggml-org/llama.cpp", tag: LLAMA_RELEASE, assets: provenance }, null, 2));
    if (existsSync(bundle)) rmSync(bundle, { recursive: true, force: true });
    renameSync(prepared, bundle);
    console.log(`Prepared official llama.cpp ${LLAMA_RELEASE} CPU and CUDA 12.4 runtimes for the standard Windows installer`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  await prepareLlamaBundle();
}
