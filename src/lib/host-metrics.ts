import type { HostSnapshot } from "./types";

type PerfMem = {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
};

async function gpuName(): Promise<string | null> {
  const nav = navigator as Navigator & {
    gpu?: {
      requestAdapter: () => Promise<{
        info?: { device?: string; vendor?: string; description?: string };
        requestAdapterInfo?: () => Promise<{ device?: string; description?: string }>;
      } | null>;
    };
  };
  try {
    const adapter = await nav.gpu?.requestAdapter();
    if (!adapter) return null;
    if (adapter.info?.device) return adapter.info.device;
    if (adapter.info?.description) return adapter.info.description;
    if (adapter.requestAdapterInfo) {
      const info = await adapter.requestAdapterInfo();
      return info.device || info.description || null;
    }
  } catch {
    return null;
  }
  return null;
}

let cachedGpu: string | null | undefined;

export async function sampleHost(): Promise<HostSnapshot> {
  if (cachedGpu === undefined) cachedGpu = await gpuName();
  const mem = (performance as Performance & { memory?: PerfMem }).memory;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return {
    at: Date.now(),
    heapUsed: mem?.usedJSHeapSize ?? null,
    heapLimit: mem?.jsHeapSizeLimit ?? null,
    cores: navigator.hardwareConcurrency || 0,
    deviceMemoryGb: deviceMemory ?? null,
    gpuName: cachedGpu ?? null,
  };
}
