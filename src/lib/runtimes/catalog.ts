import records from "./catalog.json";
import type { ProviderRecord, RuntimeRecord } from "./contracts";

export const RUNTIMES: readonly RuntimeRecord[] = records as RuntimeRecord[];

export const PROVIDERS: readonly ProviderRecord[] = [
  {
    id: "openai", label: "OpenAI API", apiOrigin: "https://api.openai.com",
    keyEnvironmentVariable: "OPENAI_API_KEY",
    documentation: "https://developers.openai.com/api/docs/models",
  },
  {
    id: "anthropic", label: "Anthropic API", apiOrigin: "https://api.anthropic.com",
    keyEnvironmentVariable: "ANTHROPIC_API_KEY",
    documentation: "https://docs.anthropic.com/en/api/messages",
  },
];

export function runtimeById(id: string) {
  return RUNTIMES.find((runtime) => runtime.id === id);
}
