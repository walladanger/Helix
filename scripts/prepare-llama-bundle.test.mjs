import { strict as assert } from "node:assert";
import test from "node:test";
import { LLAMA_RELEASE, validateAssets } from "./prepare-llama-bundle.mjs";

test("installer accepts only the pinned official CUDA assets and SHA256 metadata", () => {
  const names = [
    `llama-${LLAMA_RELEASE}-bin-win-cuda-12.4-x64.zip`,
    "cudart-llama-bin-win-cuda-12.4-x64.zip",
  ];
  const release = { tag_name: LLAMA_RELEASE, draft: false, assets: names.map((name) => ({
    name, browser_download_url: `https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_RELEASE}/${name}`,
    digest: `sha256:${"a".repeat(64)}`, size: 10000,
  })) };
  assert.equal(validateAssets(release).length, 2);
  assert.throws(() => validateAssets({ ...release, tag_name: "latest" }));
  assert.throws(() => validateAssets({ ...release, assets: [{ ...release.assets[0], digest: "" }, release.assets[1]] }));
});
