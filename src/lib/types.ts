import type { GpuId, ModelId } from "./models";

export type AppId =
  | "telemetry"
  | "bench"
  | "eval"
  | "hardware"
  | "cost"
  | "settings"
  | "recycle";

export type WinState = {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
};

export type BenchMetrics = {
  id: string;
  at: number;
  model: ModelId;
  promptChars: number;
  outputText: string;
  ttftMs: number;
  tpotMs: number;
  outputTps: number;
  promptTps: number;
  totalMs: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  cacheHitPct: number;
  costUsd: number;
  entropyBpc: number | null;
};

export type QualityScores = {
  at: number;
  model: ModelId;
  mmlu: number | null;
  gsm8k: number | null;
  humanEval: number | null;
  perplexityProxy: number | null;
  rag: {
    contextPrecision: number;
    faithfulness: number;
    answerRelevance: number;
  } | null;
  details: { suite: string; passed: number; total: number; notes: string[] };
};

export type Settings = {
  model: ModelId;
  gpu: GpuId;
  kwhUsd: number;
  carbonGPerKwh: number;
};

export type HostSnapshot = {
  at: number;
  heapUsed: number | null;
  heapLimit: number | null;
  cores: number;
  deviceMemoryGb: number | null;
  gpuName: string | null;
};
