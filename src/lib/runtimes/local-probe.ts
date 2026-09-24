import type { ProbeResult } from "./contracts";

const LOCAL_APIS = {
  "llama-cpp": { port: 8080, path: "/v1/models" },
  "lm-studio": { port: 1234, path: "/api/v1/models" },
} as const;

export type LocalRuntimeId = keyof typeof LOCAL_APIS;

// The endpoint is deliberately fixed to numeric loopback; no URL or host
// supplied by an HTTP caller can turn this into an arbitrary request proxy.
export async function probeLocalRuntime(
  id: LocalRuntimeId,
  request: typeof fetch = fetch,
): Promise<ProbeResult> {
  const api = LOCAL_APIS[id];
  const source = `http://127.0.0.1:${api.port}`;
  try {
    const result = await request(`${source}${api.path}`, {
      method: "GET", redirect: "error", signal: AbortSignal.timeout(1500),
    });
    if (result.status === 401 || result.status === 403) {
      return { status: "unauthorized", source, models: [], details: "Local server requires its own API token" };
    }
    if (result.status === 404) {
      return { status: "unsupported", source, models: [], details: "This server version does not expose the expected model API" };
    }
    if (!result.ok) return { status: "unavailable", source, models: [], details: `HTTP ${result.status}` };
    const data: unknown = await result.json();
    if (!data || typeof data !== "object") throw new Error("Invalid model list");
    const list = (data as { data?: unknown }).data;
    if (!Array.isArray(list)) throw new Error("Invalid model list");
    return {
      status: "available", source,
      models: list.flatMap((item) =>
        item && typeof item === "object" && typeof item.id === "string" ? [item.id] : []),
    };
  } catch {
    return { status: "unavailable", source, models: [], details: "Server offline or returned an invalid response" };
  }
}
