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
The installer build downloads and verifies a pinned Windows CUDA 12.4 llama.cpp
release, then includes `llama-server.exe` and its runtime libraries. Model
weights are not bundled. In desktop Settings, enter the absolute path to an
existing `.gguf` file and select **Launch bundled llama.cpp**. It serves on
`127.0.0.1:8080` with layer splitting across available CUDA GPUs and stops
when Helix exits. NVIDIA CUDA compatible drivers are required for that build.

Helix includes an LM Studio local API connection, but LM Studio itself must be
installed and its server started separately. The OpenAI and Anthropic
connections include request adapters and check whether `OPENAI_API_KEY` and
`ANTHROPIC_API_KEY` are set in Helix's desktop environment; checking their
status sends no inference requests. These adapters are not yet wired into Bench
Lab. The existing xAI benchmarks still use `XAI_API_KEY`. All remaining
catalogued runtimes have official installation links, not automatic installers
or verified integrations. See [`docs/architecture/runtime-coverage.md`](docs/architecture/runtime-coverage.md)
for their current support state and [`docs/agent-connection-plan.md`](docs/agent-connection-plan.md)
for the separate local agent telemetry plan.
