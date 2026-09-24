# Helix

Windows-style desktop for measuring LLM speed, hardware, quality, and cost.

## Apps

- **Telemetry** — live Quick Probe for TTFT, TPOT, and tokens/sec
- **Hardware** — KV cache, VRAM estimates, fragmentation, GPU/CPU
- **Bench Lab** — streaming latency and throughput runs
- **Eval Suite** — MMLU / GSM8K / HumanEval / RAG slices
- **Cost Ledger** — energy and API cost per token

## Run

```bash
npm install
npm run dev
```

Set `XAI_API_KEY` for live Grok probes.

## Stack

Vite, React, TypeScript, Tailwind CSS, TanStack Start.

## Windows desktop installer

The Windows installer bundles Helix's existing Node server and opens it in a
frameless Tauri window. The server binds to `127.0.0.1` on an available port;
the window starts and stops it automatically. No development tools or visible
terminal are needed on the installed machine. The outer window has native
minimize, maximize, drag, and close controls; Helix's internal desktop remains
as it is.

Download the `Helix-Windows-Installer` artifact from the **Helix Windows
installer** GitHub Actions workflow. Building locally requires Node 22, Rust,
and the [Windows Tauri prerequisites](https://v2.tauri.app/start/prerequisites/):

```bash
npm ci
npm run desktop:installer
```

The NSIS installer is written under `src-tauri/target/release/bundle/nsis/`.
The current app still requires the existing `XAI_API_KEY` environment variable
for live xAI benchmarks. No agent telemetry integration is included; see
[`docs/agent-connection-plan.md`](docs/agent-connection-plan.md).
