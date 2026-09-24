export type RuntimeSupport = "catalogued" | "compatible" | "native";
export type RuntimeRoute =
  | "native-api" | "compatible-api" | "runner" | "workflow"
  | "orchestrator" | "device-layer";
export type RuntimeInstall =
  | "bundled-windows" | "official-separate-installer"
  | "official-download" | "platform-gated";

export type RuntimeRecord = {
  id: string;
  name: string;
  group: "local" | "serving" | "library" | "media" | "edge";
  role: string;
  formats: string;
  modelExamples: string;
  purpose: string;
  requirements: string;
  documentation: string;
  route: RuntimeRoute;
  install: RuntimeInstall;
  support: RuntimeSupport;
};

// A provider endpoint is not a local inference runtime. Provider connection
// code can ship in Helix without shipping a provider's hosted weights or keys.
export type ProviderRecord = {
  id: "openai" | "anthropic";
  label: string;
  apiOrigin: string;
  keyEnvironmentVariable: string;
  documentation: string;
};

export type ProbeResult = {
  status: "available" | "unavailable" | "unauthorized" | "unsupported";
  source: string;
  models: string[];
  details?: string;
};
