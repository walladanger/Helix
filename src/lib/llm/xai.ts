import { isModelId, modelMeta, type ModelId } from "../models";

export type ChatUsage = {
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  costUsd: number;
};

type UsageBlob = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost_in_usd_ticks?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  prompt_cache_hit_tokens?: number;
};

export function parseUsage(raw: UsageBlob | undefined, model: ModelId): ChatUsage {
  const promptTokens = raw?.prompt_tokens ?? raw?.input_tokens ?? 0;
  const completionTokens = raw?.completion_tokens ?? raw?.output_tokens ?? 0;
  const cachedTokens =
    raw?.prompt_tokens_details?.cached_tokens ?? raw?.prompt_cache_hit_tokens ?? 0;
  let costUsd = 0;
  if (typeof raw?.cost_in_usd_ticks === "number") {
    costUsd = raw.cost_in_usd_ticks / 1e10;
  } else {
    const meta = modelMeta(model);
    const billedIn = Math.max(0, promptTokens - cachedTokens);
    costUsd =
      (billedIn / 1e6) * meta.inputPerM +
      (cachedTokens / 1e6) * meta.cachedPerM +
      (completionTokens / 1e6) * meta.outputPerM;
  }
  return { promptTokens, completionTokens, cachedTokens, costUsd };
}

export async function xaiChat(opts: {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens: number;
  stream?: boolean;
}) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, error: "AI is not available in this environment" };
  }
  const model: ModelId = isModelId(opts.model) ? opts.model : "grok-4.5";
  const body = {
    model,
    messages: opts.messages,
    max_tokens: opts.maxTokens,
    stream: Boolean(opts.stream),
    ...(opts.stream ? { stream_options: { include_usage: true } } : {}),
  };
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  let res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (res.status === 404 && model === "grok-4.5") {
    res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, model: "grok-4.7" }),
    });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false as const,
      error: `xAI API error ${res.status}${text ? `: ${text.slice(0, 180)}` : ""}`,
    };
  }
  return { ok: true as const, res, model };
}

export async function* iterateSse(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) return;
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        yield JSON.parse(payload) as {
          choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
          usage?: UsageBlob;
        };
      } catch {
        /* ignore keepalives */
      }
    }
  }
}
