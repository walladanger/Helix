# Helix Universal Runtime Integration Implementation Plan

> For agentic workers: follow this plan task by task after Warwick approves it. Use the writing-plans execution workflow. Do not create the GitHub branch or change application code before approval.

**Implementation authorized 2026-09-24:** begin on the local `codex/helix-universal-runtimes` branch, which inherits the existing local Tauri installer work. The remote `main` commit is unchanged from the recorded baseline. This branch is local until GitHub publication is available.

### Packaging decision for the first runtime build

- Bundle the Helix connectors for llama.cpp, LM Studio, OpenAI and Anthropic in the app; a connector is small code, not a copy of a model or a hosted inference engine. Preserve the current xAI route.
- Bundle a pinned, official llama.cpp Windows CUDA `llama-server` and its matching dependencies in the Windows installer. Verify the release owner/tag, asset digest and executable presence at build time. Do not bundle model weights; model files are user-selected.
- Detect an already installed LM Studio and connect using its documented local API. Offer its official installer page when missing. Its 2026-08-23 desktop terms prohibit redistributing the application without separate permission; never ship an LM Studio binary in Helix's installer.
- OpenAI and Anthropic are hosted API connections. Include their adapters, but no keys, server binaries, subscriptions or requests are installed automatically. A user must deliberately configure and test an account before a paid request.
- Catalogued optional runtimes expose official install/release links, platform prerequisites, and clear verification states. Add a verified downloader/installer per engine only after its distribution terms, artifacts and checksums are reviewed. A link is labelled `Open official download`, not `Installed`.
- Installing a runtime must never imply downloading its model weights. Large files are an opt-in action with visible sizes and destination.

The first build gate creates the catalog and packaging contract, then a working local connection path and provider adapters. No runtime is marked verified until tested against a live instance on its supported platform. The Tauri installer gate is separate from a Linux typecheck or mocked API test.

**Goal:** Make Helix connect to, identify, probe, benchmark and accurately monitor every applicable entry in the attached 63-entry inference runtime catalog, with a defined integration route and platform status for each.

**Architecture:** Preserve the current React/TanStack desktop interface. Add a typed runtime registry, reusable adapters for HTTP servers, native library runners, workflows and hardware telemetry. A companion process on the machine doing inference bridges local APIs and reads process/device counters. The web app continues to work for reachable remote endpoints.

**Tech stack:** Existing Vite, React, TypeScript, TanStack Start, Zustand and Zod; versioned local Windows companion with NVML; isolated optional Python workers for SDK runtimes. Choose Rust/Tauri sidecar versus standalone signed companion at the packaging gate after a proof of concept.

**Spec:** AI_Inference_Runtime_and_Model_Format_Catalog.md supplied with this request (2026-09-24). This is a review copy; after approval copy the spec to docs/reference/runtime-catalog.md and this plan to docs/superpowers/plans/ in the Helix branch.

## Baseline, constraints and meaning of support

- Repository: walladanger/Helix, main HEAD fa8fddc92b109e626f9c3947aea16faad7dd75ba as inspected 2026-09-24. Recheck main before creating proposed branch codex/helix-universal-runtimes.
- User workstation: Windows 11 with two RTX 3090 GPUs, 24 GB each. Represent two GPU devices and their actual free memory independently. 48 GB total installed VRAM is not one contiguous 48 GB allocation.
- Three support levels: **Native** = purpose-built adapter and proven real smoke; **Compatible** = generic transport with version/capability validation and proven smoke; **Catalogued** = tracked with installation, platform and prerequisite information, but not yet proven. Report unavailable separately. Do not call any runtime “working” merely because its name appears in a registry.
- “All runtimes” means every one of the 63 catalog entries gets a typed integration route, requirements, capability probe and appropriate verification gate. It does not mean installing every engine, converting arbitrary model files or running Apple/mobile engines on Windows.
- Keep the current desktop layout and xAI path. Add a connection manager in Settings and target selectors within existing apps. Do not download models, launch engines, run paid requests or import files without an explicit user action.
- Preserve the existing repository AGENTS.md preview/auth/PWA contracts on implementation; re-read the current version first. Plan stage does not create a branch or change application code.
- File container, architecture, tokenizer and execution format are separate. GGUF or Safetensors alone never guarantees that a specific model works. Store model revision and conversion provenance.

### What Helix currently does

The repo is a web app with a Windows-style interface, not a local Windows program. src/routes/api/bench.ts, src/lib/llm/xai.ts and src/lib/llm/eval.ts probe xAI only. src/lib/models.ts includes two Grok IDs and example GPUs but no RTX 3090. src/lib/hardware.ts uses an illustrative fixed architecture. src/lib/host-metrics.ts measures browser heap and WebGPU adapter, not inference GPU allocation. src/lib/store.ts assumes one model/provider and persists in helix-desk-v1.

The bench stream treats arriving text chunks like tokens and approximates missing counts from words; those cannot be displayed as precise token rates. The code evaluation path runs generated JavaScript with new Function. Isolate or disable it before accepting arbitrary local/remote models. The first useful deliverable should be real Windows telemetry and working connections to llama.cpp, Ollama and LM Studio, while preserving current xAI behavior.

## Shared contracts and data

Create src/lib/runtimes/contracts.ts and a matching versioned agent protocol under packages/helix-agent. Distinguish runtime role (engine, server, wrapper, library, workflow, device), transport (OpenAI chat/responses, native HTTP, Prometheus, WebSocket, runner, device SDK), and task (chat, embedding, rerank, vision, image, video, ASR, TTS, classification, custom).

An InferenceTarget has stable target ID; connection/host ID; outer runtime and optional underlying engine; model ID/revision/format/quantization; GPU UUID list; measured capabilities; and support level. A RuntimeAdapter supplies discover(connection), probe(target), run(request, cancellation), observe(target). A CapabilityReport has declared, tested and missing capabilities, plus available metrics. A RunEvent distinguishes text chunks from actual output tokens, usage, media-job completion and errors. All records carry schema version and source.

Every run records runtime and underlying backend, adapter/agent versions, host, model revision, driver, quantization, device split, sampler parameters, context, cold/warm start, clocks and correlation ID. Wrappers such as LocalAI, Triton and SwarmUI produce one request record; attach the backend and device data rather than duplicating the work.

**Metric rules:** Time to first visible output is client-observed first-output latency; call it TTFT only for a known token stream. TPOT and tokens/sec require actual token counts or trustworthy engine timing. Pre-fill speed requires engine counters; prompt tokens divided by TTFT includes queue/network delay and cannot be labeled pure pre-fill. Show “unavailable” for missing measurements rather than zero. Separate process VRAM, device-wide VRAM, estimated KV and sampled power. Power integrated over a run is an estimate, explicitly shared-device when other jobs use the GPU. Distinguish per-request latency from aggregate server throughput and local electricity cost from hosted model billing.

## Connection topology and safety

Helix web/desktop UI talks to its existing hosted xAI route for xAI, to paired agents for local/WSL/remote machines, and to approved reachable remote APIs where suitable. The companion talks to configured model servers, isolated SDK workers and NVML. Vercel functions run away from the user's Windows workstation; browser WebGPU/heap data cannot replace NVML and process counters.

Pair with a short-lived user-visible code; bind the agent to loopback by default, pin approved origins, rotate scoped secrets and store credentials in the agent's OS secret storage, not in browser localStorage. An explicitly paired remote agent uses authenticated transport. Allow configured endpoint hosts only, validate redirects and DNS resolution, cap body size and timeouts, and redact prompts/keys from diagnostics. A hosted route must never become a general URL proxy. Prove deployed HTTPS browser-to-loopback connectivity in a test: if browser private-network/CORS rules block it, provide the desktop shell connection or a paired secure relay. Do not expose an unauthenticated local listener to the network.

## Coverage matrix for every catalog entry

Legend: A = purpose-built API/metrics adapter; C = validated compatible API profile; R = separately installed SDK/CLI runner with declared task and model; W = workflow/job adapter; P = platform-gated target. Routes indicate planned work, not existing verified support.

| Section | Entries and integration routes |
| --- | --- |
| Local desktop and small servers (15) | llama.cpp A; Ollama A; LM Studio A; Radium A with llama.cpp backend attribution; Jan C; GPT4All C/R; KoboldCpp C/A; LocalAI C/A with engine attribution; mistral.rs C/R; MLC LLM R/P; MLX LM R/P Apple; ExLlamaV2 R; ExLlamaV3 R; TabbyAPI C/A with ExLlama attribution; llama-cpp-python C/A with underlying llama.cpp attribution. |
| Throughput servers and orchestration (15) | vLLM A/P WSL or Linux; SGLang A/P WSL or Linux; HF Text Generation Inference A/P Linux; TensorRT-LLM A/R/P Linux; NVIDIA Triton A with backend metadata; NVIDIA NIM C/A per validated image/profile; NVIDIA Dynamo A with routed underlying engine; LMDeploy C/A; Xinference A with backend lookup; Ray Serve LLM A with replica scope; BentoML C/R with declared service backend; DeepSpeed-MII C/R; LightLLM C/A; Aphrodite Engine C/A; OpenVINO Model Server A/P Intel optimizations. |
| General model libraries (15) | PyTorch R; HF Transformers R; HF Diffusers R; HF Accelerate R as device layer on its parent worker; ONNX Runtime R; ONNX Runtime GenAI R above ONNX; OpenVINO GenAI R/P Intel; NVIDIA TensorRT R for compiled engines; TensorFlow/Keras R; JAX/Flax R/P supported GPU platform; Apple MLX R/P Apple; CTranslate2 R; Sentence Transformers R; FastEmbed R; Transformers.js R/P Node/browser. |
| Image, video and speech (10) | ComfyUI W/A; InvokeAI W/A; AUTOMATIC1111 WebUI W/C; SD WebUI Forge W/C; SwarmUI W/A with backend identification; stable-diffusion.cpp R/C; whisper.cpp R/C; faster-whisper R via CTranslate2; sherpa-onnx R via ONNX; Piper R via ONNX. |
| Browser, mobile and edge (8) | WebLLM R/P WebGPU; ONNX Runtime Web R/P browser; Apple Core ML R/P Apple; Google LiteRT R/P supported Android/edge; ExecuTorch R/P supported edge; ncnn R/P supported device/Vulkan; MNN/MNN-LLM R/P supported edge; Paddle FastDeploy R/P supported backend. |

Each record also includes supported OS/accelerator requirements, model family plus format predicates, needed packages, endpoint or runner profile, telemetry capabilities, documentation link, last-tested version and smoke fixture. Wrappers and device layers can appear in the topology without claiming a second execution.

## Tasks and independent review gates

Each task ends with fixture tests, a meaningful smoke where available, a review and a commit. New file paths below are proposed. Run npm test, npm run typecheck, npm run lint and npm run build at meaningful gates. Update the test script to include the new tests; preserve existing suite. Reference implementations should use the repo's established TypeScript style. The hardware agent needs a separate Windows test pipeline.

### Task 0. Catalog and baseline

**Files:** Create docs/reference/runtime-catalog.md, docs/architecture/runtime-coverage.md; copy this plan; modify README.md.

- [ ] After approval, fetch current main and AGENTS.md, create the feature branch from exact HEAD, record baseline tests/CI.
- [ ] Enter all 63 records and routes in a machine-readable registry seed; validate count 63, unique IDs and evidence link for each. Generate the readable coverage table from that seed.
- [ ] Explain the three support levels, actual runtime versus wrapper, and runtime versus model format.
- [ ] Gate: catalog count and checksum of source copy, no application behavior change, baseline tests/build and commit.

### Task 1. Registry, identity and history migration

**Files:** Create src/lib/runtimes/contracts.ts, registry.ts, metrics.ts and focused tests; modify src/lib/models.ts, src/lib/types.ts, src/lib/store.ts.

- [ ] Define target identity by runtime, host, connection, model and revision. Validate capability + architecture + format together. Cover duplicate model names on different hosts, unsupported GGUF architecture, wrapper backend and unknown revision in tests.
- [ ] Migrate persisted helix-desk-v1 to versioned v2 settings/history without losing Grok runs or user energy inputs. Replace global model ID with target ID while keeping xAI as a usable default.
- [ ] Add RTX 3090 profile as a clearly labeled fallback estimate; actual device IDs and capacities come from the agent.
- [ ] Gate: old persisted fixtures load without mutation/loss, disconnected target retains history, xAI tests pass; commit.

### Task 2. Connections and reliable streaming

**Files:** Create src/lib/runtimes/connections.ts, transport/http.ts, transport/sse.ts, their tests, src/routes/api/runtime-connections.ts; modify src/components/apps/Settings.tsx.

- [ ] Let user add, test, inspect, select and remove a connection. Store secrets only in agent/secret store; store redacted connection metadata locally. Reject endpoints outside approved host list and guard against redirects/rebinding.
- [ ] Parse SSE across split chunks, CRLF, multiple data lines, keepalive, DONE, malformed JSON, structured usage and AbortSignal. Preserve exact Unicode output. Do not equate chunks with tokens.
- [ ] Gate: auth error, timeout, unreachable local host, cancellation, SSRF attempt and deployed-browser connectivity have explicit diagnoses; commit.

### Task 3. Windows local companion and actual GPUs

**Files:** Create packages/helix-agent with protocol, pairing, allowed endpoints, NVML collector, Windows packaging/tests; create docs/install/windows-agent.md; modify src/lib/host-metrics.ts and src/components/apps/Hardware.tsx.

- [ ] Build a versioned loopback companion with health/version, pair/revoke, bounded polling, clean shutdown and config migration. Prove browser/Desktop shell connection before committing to final packaging.
- [ ] Report GPU UUID, name, total/used/free VRAM, utilization, power, temperature, visible process PID/VRAM and time. Map runtime PID and children to each GPU when possible; ambiguous shared use is marked unknown.
- [ ] Test no-driver/offline/restarted companion, two independent 3090-like devices in CI; run on user's real dual RTX 3090 when available.
- [ ] Gate: show two 24 GB devices, not one 48 GB allocation; browser heap remains explicitly browser heap; commit.

### Task 4. First useful local release: llama.cpp, Ollama, LM Studio

**Files:** Create src/lib/runtimes/adapters/llama-cpp.ts, ollama.ts, lm-studio.ts, openai-compatible.ts with fixtures/tests; modify src/routes/api/bench.ts, src/lib/llm/client-bench.ts, src/components/apps/Bench.tsx and Telemetry.tsx.

- [ ] llama.cpp: health, model identity, slots and opt-in metrics. Ollama: model list, loaded/running state and response timings. LM Studio: v1 models/load state and native timing where available. Feature-detect versions and use compatible API only where tested.
- [ ] Select target in Quick Probe and Bench Lab. Stream and cancel requests, display source/quality of counts and timings, retain xAI. History compares runs by runtime, model/revision, parameters and host.
- [ ] Gate: three working local server smokes on Windows with measured per-GPU data; fixtures for missing usage, split SSE, aborted run, model unload/reload and disconnected endpoint. Ship the first release candidate at this gate; commit.

### Task 5. Metrics, eval and accounting correctness

**Files:** Modify src/lib/llm/eval.ts, src/lib/hardware.ts, and EvalSuite, Cost, Hardware, Telemetry components; create src/lib/runtimes/energy.ts and tests.

- [ ] Route eval only to models with matching capability. Pin prompt, dataset slice, context, model revision, seed/sampler where supported. Mark the existing short question collections as illustrative slices rather than full benchmark scores.
- [ ] Sandbox resource-limited generated code grading in a separate worker/process, or disable executable-code grading until isolation exists; test hostile generated code cannot reach the host.
- [ ] Replace fixed generic KV/VRAM/SM figures with actual engine counters where present or model-specific labeled estimates. Unknown architecture and unavailable counters display unavailable.
- [ ] Integrate sampled power across each run; warn if GPU shared with another task. Use actual hosted pricing/usage for xAI and optional user-configured electricity pricing for local engines.
- [ ] Gate: unrelated GPU process does not become precise per-model energy cost, missing counters never become zero, old run labels migrate; commit.

### Task 6. Server and wrapper expansion

**Files:** Add grouped adapters/fixtures in src/lib/runtimes/adapters; add docs/compatibility/servers.md.

- [ ] Batch 6a: Jan, GPT4All, KoboldCpp, LocalAI, mistral.rs, TabbyAPI, llama-cpp-python and Radium.
- [ ] Batch 6b: vLLM, SGLang, TGI, LMDeploy, LightLLM and Aphrodite.
- [ ] Batch 6c: Triton, NIM, Dynamo, Xinference, Ray Serve, BentoML, DeepSpeed-MII, OpenVINO Model Server and TensorRT-LLM.
- [ ] For every server: negotiate version/features, discover model and load state, scope queue/request/aggregate counters correctly, record backend identity or unknown. A passing compatible transport is not proof that every native metric exists.
- [ ] Gate each batch independently with fixture plus reachable reference-server smoke; WSL/Linux and profile-specific entries remain platform gated until real verification. Commit each batch.

### Task 7. SDK libraries, diffusion, speech and video

**Files:** Create packages/helix-runners with versioned worker protocol, isolated Python environments and per-family entrypoints; add workflow adapters, tests and docs/compatibility/workflows.md.

- [ ] Start with one explicit Transformers/PyTorch CUDA text runner and an embedding runner; then Diffusers/Accelerate, ONNX/GenAI, Sentence Transformers/FastEmbed, CTranslate2, TensorRT, TensorFlow, JAX, OpenVINO, MLX, MLC, ExLlama and other catalogued libraries as their supported environments permit. Use user-provided installed models; isolate incompatible package versions.
- [ ] ComfyUI: queue/job/history/WebSocket. InvokeAI, A1111, Forge and SwarmUI: adapter for actual workflow APIs, output media, seed, steps, size, elapsed time and device samples. Track model and backend for each graph where visible.
- [ ] whisper.cpp, faster-whisper, sherpa-onnx and Piper use ASR/TTS task records with duration and audio-specific throughput, not chat token speed. Include one video-capable workflow fixture and smoke on a supported model.
- [ ] Gate: one live text, embedding, diffusion image, video workflow, ASR and TTS test; each individual engine moves to verified only after its own real smoke. Commit by family.

### Task 8. Other platforms, installer and release

**Files:** Platform recipes under packages/helix-agent/platforms, docs/compatibility and docs/install; Windows artifact workflow in .github/workflows; desktop entrypoint only after shell selection.

- [ ] Optional macOS companion for MLX/MLX LM/Core ML; browser/Node runners for WebLLM/ONNX Runtime Web/Transformers.js; paired Android/edge runners for LiteRT/ExecuTorch/ncnn/MNN/FastDeploy. Gate compiled/converted model formats and actual accelerator support. Do not package Apple binaries into Windows setup.
- [ ] Provide Windows shortcut/desktop shell that starts/pairs agent, opens current Helix UI, reconnects and shuts down owned processes cleanly with no visible terminal. Keep web mode useful for remote endpoints.
- [ ] CI covers 63-record count, protocol contracts, fixtures, TypeScript/lint/build, Windows package/restart/update/rollback and Linux/macOS jobs where available. Generate public compatibility report with verified, compatible but untested, platform gated, unavailable and last-tested versions.
- [ ] Gate: clean install on the dual-3090 Windows system, offline/remote modes, secret-redacted export, full branch review, PR; do not merge until separately approved if approval remains required.

## Specific failure cases for review

1. Two endpoints have the same model name: history and selected target must remain distinct (Task 1).
2. One text chunk contains multiple tokens or partial Unicode: token count and TPOT remain unknown without reliable usage (Tasks 2/4).
3. LocalAI/Triton/SwarmUI wraps a backend: one run and one GPU sample cannot appear as two workloads (Tasks 1/6).
4. GPU 0 lacks free VRAM though GPU 1 has room: placement check must respect runtime split/offload support (Tasks 3/7).
5. Deployed HTTPS page cannot reach loopback: give actionable guidance, preserve remote/xAI mode and never open an unauthenticated agent port (Tasks 2/3/8).

## Delivery schedule (rough solo-engineer planning ranges)

| Gate | Result | Estimate |
| --- | --- | --- |
| A: tasks 0–2 | Registry, connection UI, model/run identities, xAI preserved | 1–2 weeks |
| B: tasks 3–4 | Working Windows agent, llama.cpp/Ollama/LM Studio probes and two GPU readings | 2–4 more weeks |
| C: task 5 | Reliable metrics, safe eval path and energy accounting | 1–2 more weeks |
| D: tasks 6–7 | Individually verified server, library, speech and creative families | Multiple months, driven by access to test engines |
| E: task 8 | Other platforms and polished desktop installer | Separate platform-specific releases |

Estimates are planning ranges, not commitments. We can ship gate B while other entries stay explicitly catalogued.

## Official references checked

- llama.cpp server API and opt-in metrics: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
- LM Studio REST API and model/timing info: https://lmstudio.ai/docs/developer/rest
- Ollama usage metrics: https://docs.ollama.com/api/usage
- ComfyUI history, queue and WebSocket: https://docs.comfy.org/development/comfyui-server/comms_routes
- NVIDIA NVML device/process counters: https://developer.nvidia.com/management-library-nvml
- vLLM GPU installation and Windows via WSL: https://docs.vllm.ai/en/latest/getting_started/installation/gpu/
- Vercel function constraints: https://vercel.com/docs/functions/runtimes

**Implementation status (2026-09-24):** The user authorized starting the project. The local branch includes the 63-entry catalogue, loopback probes for llama.cpp and LM Studio, OpenAI and Anthropic request adapters, and a pinned llama.cpp Windows installer recipe. The bundled server can be launched explicitly with a GGUF path; other runtime installers remain official links pending verified manifests. Windows installer execution, two-GPU measurements, target selection and the remaining runtime adapters are outstanding gates. Do not mark them verified until their platform smokes pass.
