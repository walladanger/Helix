import test from "node:test";
import assert from "node:assert/strict";

function stubNavigator(value: any) {
  Object.defineProperty(globalThis, "navigator", { value, configurable: true });
}

function stubPerformance(value: any) {
  Object.defineProperty(globalThis, "performance", { value, configurable: true });
}

function resetGlobals() {
  stubNavigator(undefined);
  stubPerformance(undefined);
}

test("host-metrics sampleHost", async (t) => {
  await t.test("all fields missing - fallbacks and cores 0", async () => {
    resetGlobals();
    stubNavigator({});
    stubPerformance({});

    const { sampleHost } = await import("./host-metrics.ts?case=missing" as string);
    const snapshot = await sampleHost();

    assert.equal(typeof snapshot.at, "number");
    assert.equal(snapshot.heapUsed, null);
    assert.equal(snapshot.heapLimit, null);
    assert.equal(snapshot.cores, 0);
    assert.equal(snapshot.deviceMemoryGb, null);
    assert.equal(snapshot.gpuName, null);
  });

  await t.test("returns adapter.info.device", async () => {
    resetGlobals();
    stubNavigator({
      hardwareConcurrency: 4,
      deviceMemory: 8,
      gpu: {
        requestAdapter: async () => ({
          info: { device: "Test GPU Device", description: "Desc" },
          requestAdapterInfo: async () => ({ device: "Other", description: "Other" }),
        }),
      },
    });
    stubPerformance({
      memory: {
        usedJSHeapSize: 100,
        jsHeapSizeLimit: 200,
      },
    });

    const { sampleHost } = await import("./host-metrics.ts?case=info_device" as string);
    const snapshot = await sampleHost();

    assert.equal(snapshot.heapUsed, 100);
    assert.equal(snapshot.heapLimit, 200);
    assert.equal(snapshot.cores, 4);
    assert.equal(snapshot.deviceMemoryGb, 8);
    assert.equal(snapshot.gpuName, "Test GPU Device");
  });

  await t.test("returns adapter.info.description", async () => {
    resetGlobals();
    stubNavigator({
      hardwareConcurrency: 8,
      deviceMemory: 16,
      gpu: {
        requestAdapter: async () => ({
          info: { description: "Test GPU Description" },
          requestAdapterInfo: async () => ({ device: "Other", description: "Other" }),
        }),
      },
    });
    stubPerformance({});

    const { sampleHost } = await import("./host-metrics.ts?case=info_desc" as string);
    const snapshot = await sampleHost();

    assert.equal(snapshot.gpuName, "Test GPU Description");
  });

  await t.test("returns requestAdapterInfo().device", async () => {
    resetGlobals();
    stubNavigator({
      hardwareConcurrency: 8,
      deviceMemory: 16,
      gpu: {
        requestAdapter: async () => ({
          requestAdapterInfo: async () => ({ device: "Info Device", description: "Other" }),
        }),
      },
    });
    stubPerformance({});

    const { sampleHost } = await import("./host-metrics.ts?case=req_info_device" as string);
    const snapshot = await sampleHost();

    assert.equal(snapshot.gpuName, "Info Device");
  });

  await t.test("returns requestAdapterInfo().description", async () => {
    resetGlobals();
    stubNavigator({
      hardwareConcurrency: 8,
      deviceMemory: 16,
      gpu: {
        requestAdapter: async () => ({
          requestAdapterInfo: async () => ({ description: "Info Desc" }),
        }),
      },
    });
    stubPerformance({});

    const { sampleHost } = await import("./host-metrics.ts?case=req_info_desc" as string);
    const snapshot = await sampleHost();

    assert.equal(snapshot.gpuName, "Info Desc");
  });

  await t.test("returns null if requestAdapter returns null", async () => {
    resetGlobals();
    stubNavigator({
      hardwareConcurrency: 2,
      gpu: {
        requestAdapter: async () => null,
      },
    });
    stubPerformance({});

    const { sampleHost } = await import("./host-metrics.ts?case=adapter_null" as string);
    const snapshot = await sampleHost();

    assert.equal(snapshot.gpuName, null);
  });

  await t.test("returns null if requestAdapter throws", async () => {
    resetGlobals();
    stubNavigator({
      hardwareConcurrency: 2,
      gpu: {
        requestAdapter: async () => {
          throw new Error("fail");
        },
      },
    });
    stubPerformance({});

    const { sampleHost } = await import("./host-metrics.ts?case=adapter_throw" as string);
    const snapshot = await sampleHost();

    assert.equal(snapshot.gpuName, null);
  });

  await t.test("caching behavior", async () => {
    resetGlobals();
    let requestCount = 0;
    stubNavigator({
      gpu: {
        requestAdapter: async () => {
          requestCount++;
          return { info: { device: "Cached GPU" } };
        },
      },
    });
    stubPerformance({});

    const { sampleHost } = await import("./host-metrics.ts?case=caching" as string);
    const snapshot1 = await sampleHost();
    assert.equal(snapshot1.gpuName, "Cached GPU");
    assert.equal(requestCount, 1);

    const snapshot2 = await sampleHost();
    assert.equal(snapshot2.gpuName, "Cached GPU");
    assert.equal(requestCount, 1); // should not increment
  });
});
