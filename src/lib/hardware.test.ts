import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  kvBytesPerToken,
  kvCacheBytes,
  activationBytes,
  peakVramBytes,
  kvFragmentation,
  smEfficiency,
  energyKwh,
  carbonG,
} from "./hardware.ts";
import { SERVING_ARCH } from "./models.ts";

describe("hardware module", () => {
  describe("kvBytesPerToken", () => {
    it("computes default architecture correctly", () => {
      // 2 * 64 * 8 * 128 * 2 = 262144
      const result = kvBytesPerToken();
      assert.equal(result, 262144);
    });

    it("computes custom architecture correctly", () => {
      const arch = { ...SERVING_ARCH, nLayers: 10, nKvHeads: 4, headDim: 64, bytes: 2 };
      // 2 * 10 * 4 * 64 * 2 = 10240
      const result = kvBytesPerToken(arch);
      assert.equal(result, 10240);
    });
  });

  describe("kvCacheBytes", () => {
    it("computes memory for sequence and batch", () => {
      // 262144 * 10 * 2 = 5242880
      const result = kvCacheBytes(10, 2);
      assert.equal(result, 5242880);
    });

    it("handles zero sequence length", () => {
      const result = kvCacheBytes(0);
      assert.equal(result, 0);
    });

    it("handles batch size of 0", () => {
      const result = kvCacheBytes(10, 0);
      assert.equal(result, 0);
    });
  });

  describe("activationBytes", () => {
    it("computes activation bytes for given sequence length and batch", () => {
      // 2 * 8192 * 10 * 2 * 2 = 655360
      const result = activationBytes(10, 2);
      assert.equal(result, 655360);
    });

    it("handles zero values", () => {
      assert.equal(activationBytes(0), 0);
      assert.equal(activationBytes(10, 0), 0);
    });
  });

  describe("peakVramBytes", () => {
    it("computes peak VRAM including weights, KV cache, and activations", () => {
      const result = peakVramBytes(10, 2);
      const weightBytes = 72 * 1024 ** 3;
      const expected = weightBytes + kvCacheBytes(10, 2) + activationBytes(10, 2);
      assert.equal(result, expected);
    });
  });

  describe("kvFragmentation", () => {
    it("computes exact page fit without waste", () => {
      // PAGE = 2097152
      // seqLen for exactly 1 page: 2097152 / 262144 = 8
      const result = kvFragmentation(8);
      assert.equal(result.used, 2097152);
      assert.equal(result.allocated, 2097152);
      assert.equal(result.waste, 0);
      assert.equal(result.wastePct, 0);
      assert.equal(result.pages, 1);
    });

    it("computes waste for partial page", () => {
      // 10 tokens: 10 * 262144 = 2621440 (requires 2 pages, 4194304 bytes)
      const result = kvFragmentation(10);
      assert.equal(result.used, 2621440);
      assert.equal(result.allocated, 4194304);
      assert.equal(result.waste, 1572864);
      assert.equal(result.wastePct, (1572864 / 4194304) * 100);
      assert.equal(result.pages, 2);
    });

    it("handles zero sequence length", () => {
      const result = kvFragmentation(0);
      assert.equal(result.used, 0);
      assert.equal(result.allocated, 0);
      assert.equal(result.waste, 0);
      assert.equal(result.wastePct, 0);
      assert.equal(result.pages, 0);
    });
  });

  describe("smEfficiency", () => {
    it("computes efficiency successfully", () => {
      const result = smEfficiency(100, 10, "h100");
      assert.ok(result.smPct >= 8 && result.smPct <= 96);
      assert.ok(result.memBoundPct >= 0 && result.memBoundPct <= 100);
      assert.ok(typeof result.note === "string");
    });
  });

  describe("energyKwh", () => {
    it("computes kWh for given duration and util", () => {
      // h100: 700W. 50% util -> 350W
      // 1 hour (3600000ms)
      const result = energyKwh(3600000, "h100", 50);
      // 350W * 1h / 1000 = 0.35 kWh
      assert.equal(result, 0.35);
    });

    it("handles zero duration", () => {
      assert.equal(energyKwh(0, "h100", 100), 0);
    });

    it("handles zero util", () => {
      assert.equal(energyKwh(1000, "h100", 0), 0);
    });
  });

  describe("carbonG", () => {
    it("computes carbon successfully", () => {
      assert.equal(carbonG(10, 50), 500);
    });
    it("handles zeroes", () => {
      assert.equal(carbonG(0, 50), 0);
      assert.equal(carbonG(10, 0), 0);
    });
  });
});
