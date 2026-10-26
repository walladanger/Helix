import { describe, test } from "node:test";
import assert from "node:assert";
import {
  MODELS,
  DEFAULT_MODEL,
  isModelId,
  modelMeta,
  GPU_PROFILES,
  gpuMeta,
  SERVING_ARCH,
} from "./models.ts";

describe("models", () => {
  test("isModelId returns true for every MODELS id", () => {
    for (const model of MODELS) {
      assert.strictEqual(isModelId(model.id), true);
    }
  });

  test("isModelId returns false for unknown or empty strings", () => {
    assert.strictEqual(isModelId("unknown-model"), false);
    assert.strictEqual(isModelId(""), false);
  });

  test("modelMeta returns the exact entry for known ids", () => {
    for (const model of MODELS) {
      assert.strictEqual(modelMeta(model.id), model);
    }
  });

  test("modelMeta returns the first model for unknown ids", () => {
    assert.strictEqual(modelMeta("unknown-model"), MODELS[0]);
  });

  test("DEFAULT_MODEL is a valid model id", () => {
    assert.strictEqual(isModelId(DEFAULT_MODEL), true);
  });

  test("gpuMeta returns the exact entry for known ids", () => {
    for (const gpu of GPU_PROFILES) {
      assert.strictEqual(gpuMeta(gpu.id), gpu);
    }
  });

  test("gpuMeta returns the first profile for unknown ids", () => {
    assert.strictEqual(gpuMeta("unknown-gpu"), GPU_PROFILES[0]);
  });

  test("GPU_PROFILES and MODELS have unique ids", () => {
    const modelIds = new Set(MODELS.map((m) => m.id));
    assert.strictEqual(modelIds.size, MODELS.length);

    const gpuIds = new Set(GPU_PROFILES.map((g) => g.id));
    assert.strictEqual(gpuIds.size, GPU_PROFILES.length);
  });

  test("SERVING_ARCH shape and values", () => {
    assert.deepStrictEqual(SERVING_ARCH, {
      nLayers: 64,
      nKvHeads: 8,
      headDim: 128,
      hiddenSize: 8192,
      bytes: 2,
      weightGB: 72,
      label: "Estimated MoE serving profile (GQA)",
    });
  });
});
