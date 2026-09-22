import { gpuMeta, SERVING_ARCH, type GpuId } from "./models";

export function kvBytesPerToken(arch = SERVING_ARCH) {
  return 2 * arch.nLayers * arch.nKvHeads * arch.headDim * arch.bytes;
}

export function kvCacheBytes(seqLen: number, batch = 1, arch = SERVING_ARCH) {
  return kvBytesPerToken(arch) * seqLen * batch;
}

export function activationBytes(seqLen: number, batch = 1, arch = SERVING_ARCH) {
  return 2 * arch.hiddenSize * seqLen * batch * arch.bytes;
}

export function peakVramBytes(seqLen: number, batch = 1, arch = SERVING_ARCH) {
  return arch.weightGB * 1024 ** 3 + kvCacheBytes(seqLen, batch, arch) + activationBytes(seqLen, batch, arch);
}

const PAGE = 2 * 1024 * 1024;

export function kvFragmentation(seqLen: number, batch = 1) {
  const used = kvCacheBytes(seqLen, batch);
  const pages = Math.ceil(used / PAGE);
  const allocated = pages * PAGE;
  const waste = allocated - used;
  return {
    used,
    allocated,
    waste,
    wastePct: allocated === 0 ? 0 : (waste / allocated) * 100,
    pages,
  };
}

export function smEfficiency(tokensPerSec: number, seqLen: number, gpuId: GpuId) {
  const gpu = gpuMeta(gpuId);
  const bytesPerTok = kvBytesPerToken() + SERVING_ARCH.hiddenSize * SERVING_ARCH.bytes;
  const required = tokensPerSec * bytesPerTok;
  const bandwidth = gpu.bandwidthTBps * 1e12;
  const memBound = bandwidth === 0 ? 0 : (required / bandwidth) * 100;
  const decodeUtil = Math.min(96, Math.max(8, memBound * 14));
  return {
    smPct: decodeUtil,
    memBoundPct: Math.min(100, memBound * 100),
    note:
      decodeUtil < 45
        ? "Low SM activity — decode is waiting on memory bandwidth or host transfer."
        : "Cores are busy; remaining slack is typical of memory-bound decode.",
  };
}

export function energyKwh(durationMs: number, gpuId: GpuId, utilPct: number) {
  const gpu = gpuMeta(gpuId);
  const watts = gpu.tdpW * (utilPct / 100);
  return (watts * (durationMs / 1000)) / 3600 / 1000;
}

export function carbonG(kwh: number, gPerKwh: number) {
  return kwh * gPerKwh;
}
