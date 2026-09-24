import { createFileRoute } from "@tanstack/react-router";
import { probeLocalRuntime } from "@/lib/runtimes/local-probe";

export const Route = createFileRoute("/api/runtime-status")({
  server: {
    handlers: {
      GET: async () => {
        // Hosted Helix cannot see the visitor's PC; no server-side LAN scans.
        const desktop = process.env.HELIX_DESKTOP === "1";
        const unavailable = { status: "unavailable" as const, models: [], details: "Open the Helix desktop app to check local servers" };
        const local = desktop ? await Promise.all([
          probeLocalRuntime("llama-cpp"), probeLocalRuntime("lm-studio"),
        ]) : [unavailable, unavailable];
        return Response.json({
          local: { "llama-cpp": local[0], "lm-studio": local[1] },
          providers: {
            openai: { configured: desktop && Boolean(process.env.OPENAI_API_KEY) },
            anthropic: { configured: desktop && Boolean(process.env.ANTHROPIC_API_KEY) },
          },
        }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
