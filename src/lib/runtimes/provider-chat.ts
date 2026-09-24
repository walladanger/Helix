import type { ProviderRecord } from "./contracts";

export type ProviderCompletion = {
  provider: ProviderRecord["id"];
  model: string;
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
  // Billed cost is not derivable without the actual account's pricing.
  costUsd: null;
};

/** Deliberate, one-shot request. Never used by discovery or status polling. */
export async function runProviderChat(options: {
  provider: ProviderRecord["id"];
  model: string;
  prompt: string;
  maxOutputTokens: number;
  key: string;
  request?: typeof fetch;
  signal?: AbortSignal;
}): Promise<ProviderCompletion> {
  const { provider, model, prompt, maxOutputTokens, key } = options;
  if (!key || !model.trim() || !prompt.trim() || !Number.isSafeInteger(maxOutputTokens)
      || maxOutputTokens < 1 || maxOutputTokens > 4096) {
    throw new Error("A provider key, model, prompt and valid token limit are required");
  }
  const origin = provider === "openai" ? "https://api.openai.com"
    : provider === "anthropic" ? "https://api.anthropic.com" : null;
  if (!origin) throw new Error("Unsupported provider");
  const isOpenAI = provider === "openai";
  const endpoint = isOpenAI ? "/v1/responses" : "/v1/messages";
  const body = isOpenAI
    ? { model, input: prompt, max_output_tokens: maxOutputTokens, store: false }
    : { model, messages: [{ role: "user", content: prompt }], max_tokens: maxOutputTokens };
  const res = await (options.request ?? fetch)(`${origin}${endpoint}`, {
    method: "POST", redirect: "error", signal: options.signal,
    headers: isOpenAI
      ? { "Content-Type": "application/json", Authorization: `Bearer ${key}` }
      : { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${provider} returned HTTP ${res.status}`);
  const result = await res.json() as {
    output?: { content?: { type?: string; text?: string }[] }[];
    content?: { type?: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = (isOpenAI
    ? result.output?.flatMap((part) => part.content ?? [])
    : result.content)?.filter((part) => part.type === "output_text" || part.type === "text")
    .map((part) => part.text ?? "").join("") ?? "";
  return {
    provider, model, text,
    inputTokens: result.usage?.input_tokens ?? null,
    outputTokens: result.usage?.output_tokens ?? null,
    costUsd: null,
  };
}
