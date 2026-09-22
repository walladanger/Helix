import type { BenchMetrics } from "../types";
import type { ModelId } from "../models";

export type BenchLive = {
  onToken: (piece: string) => void;
  onStart?: (model: string) => void;
};

export async function runBench(opts: {
  prompt: string;
  model: ModelId;
  maxTokens?: number;
  signal?: AbortSignal;
  live?: BenchLive;
}): Promise<BenchMetrics> {
  const res = await fetch("/api/bench", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: opts.prompt,
      model: opts.model,
      maxTokens: opts.maxTokens ?? 96,
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  if (!res.body) throw new Error("No stream");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let metrics: BenchMetrics | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const chunks = buf.split("\n\n");
    buf = chunks.pop() ?? "";
    for (const block of chunks) {
      const line = block.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const payload = JSON.parse(line.slice(5).trim()) as
        | { type: "start"; model: string }
        | { type: "token"; text: string }
        | { type: "error"; error: string }
        | { type: "done"; metrics: Omit<BenchMetrics, "id" | "at"> };
      if (payload.type === "start") opts.live?.onStart?.(payload.model);
      if (payload.type === "token") opts.live?.onToken(payload.text);
      if (payload.type === "error") throw new Error(payload.error);
      if (payload.type === "done") {
        metrics = {
          ...payload.metrics,
          id: crypto.randomUUID(),
          at: Date.now(),
          model: payload.metrics.model,
        };
      }
    }
  }
  if (!metrics) throw new Error("Incomplete bench stream");
  return metrics;
}
