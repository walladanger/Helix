# Helix agent connection: proposed scope

## Current behavior

Helix does not ingest data from an operating AI agent. Its live speed and cost
measurements come from Helix-initiated xAI requests through `/api/bench` and
server functions; live calls require `XAI_API_KEY`. Browser APIs report limited
workstation information. GPU, VRAM, KV cache, and SM displays are estimates,
not hardware counters. The installer only packages these existing behaviors.

## Proposed connection, for separate approval and implementation

1. Identify the actual agent or inference runtime to observe, its supported
   telemetry surface, and which machine runs it. Determine whether it exposes
   OpenTelemetry, an HTTP endpoint, structured logs, or only process counters.
2. Add an optional, read-only local collector with explicit adapter interfaces
   for agent events and inference metrics. Prefer the runtime's documented
   telemetry instead of scraping its window. Never store API keys in the UI.
3. Define a versioned event envelope (`source`, `model`, `runId`, `timestamp`,
   `metric`, `value`, `unit`) plus connection status and loss/retry states.
4. Authenticate any network listener, bind locally by default, and test that
   unrelated processes and remote hosts cannot submit events. Keep native
   shell permissions separate from the agent data frame.
5. Show a clear source label for measured, estimated, and unavailable values.
   Verify event ordering, disconnect/reconnect, and dual-GPU attribution with
   the real agent before calling the integration complete.

No collector, adapter, or telemetry UI has been implemented by this installer.
