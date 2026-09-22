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
