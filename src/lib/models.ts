export const MODELS = [
  {
    id: "grok-4.5",
    label: "Grok 4.5",
    inputPerM: 2,
    outputPerM: 6,
    cachedPerM: 0.5,
    context: 500_000,
  },
  {
    id: "grok-4.7",
    label: "Grok 4.7",
    inputPerM: 2,
    outputPerM: 6,
    cachedPerM: 0.5,
    context: 500_000,
  },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "grok-4.5";

export function isModelId(value: string): value is ModelId {
  return MODELS.some((m) => m.id === value);
}

export function modelMeta(id: string) {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

export const GPU_PROFILES = [
  { id: "h100", name: "H100 80GB", vramGB: 80, tdpW: 700, bandwidthTBps: 3.35, smCount: 132 },
  { id: "h200", name: "H200 141GB", vramGB: 141, tdpW: 700, bandwidthTBps: 4.8, smCount: 132 },
  { id: "b200", name: "B200 192GB", vramGB: 192, tdpW: 1000, bandwidthTBps: 8.0, smCount: 148 },
  { id: "a100", name: "A100 80GB", vramGB: 80, tdpW: 400, bandwidthTBps: 2.039, smCount: 108 },
  { id: "4090", name: "RTX 4090 24GB", vramGB: 24, tdpW: 450, bandwidthTBps: 1.008, smCount: 128 },
  { id: "5090", name: "RTX 5090 32GB", vramGB: 32, tdpW: 575, bandwidthTBps: 1.792, smCount: 170 },
] as const;

export type GpuId = (typeof GPU_PROFILES)[number]["id"];

export function gpuMeta(id: string) {
  return GPU_PROFILES.find((g) => g.id === id) ?? GPU_PROFILES[0];
}

/**
 * Serving-side transformer estimates. Grok internals are not public;
 * these are labeled as estimates and used only for KV / VRAM math.
 */
export const SERVING_ARCH = {
  nLayers: 64,
  nKvHeads: 8,
  headDim: 128,
  hiddenSize: 8192,
  bytes: 2,
  weightGB: 72,
  label: "Estimated MoE serving profile (GQA)",
};
