import { strict as assert } from "node:assert";
import test from "node:test";
import { LLAMA_RELEASE, validateAssets } from "./prepare-llama-bundle.mjs";

test("standard installer requires both CPU and CUDA builds plus verified CUDA libraries", () => {
  const names = [
    `llama-${LLAMA_RELEASE}-bin-win-cpu-x64.zip`,
    `llama-${LLAMA_RELEASE}-bin-win-cuda-12.4-x64.zip`,
    "cudart-llama-bin-win-cuda-12.4-x64.zip",
  ];
  const release = { tag_name: LLAMA_RELEASE, draft: false, assets: names.map((name) => ({
    name, browser_download_url: `https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_RELEASE}/${name}`,
    digest: `sha256:${"a".repeat(64)}`, size: 10000,
  })) };
  const assets = validateAssets(release);
  assert.deepEqual(assets.map((asset) => asset.backend), ["cpu", "cuda", "cuda"]);
  assert.throws(() => validateAssets({ ...release, assets: release.assets.slice(1) }));
  assert.throws(() => validateAssets({ ...release, tag_name: "latest" }));
  assert.throws(() => validateAssets({ ...release, assets: [{ ...release.assets[0], digest: "" }, release.assets[1]] }));
});
