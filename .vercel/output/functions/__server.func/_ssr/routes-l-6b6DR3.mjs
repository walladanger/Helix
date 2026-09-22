import { i as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as gpuMeta, i as SERVING_ARCH, n as GPU_PROFILES, r as MODELS, s as modelMeta, t as DEFAULT_MODEL } from "./models-1pMUrgZU.mjs";
import { a as Settings2, c as Minus, d as FlaskConical, f as Cpu, i as Square, l as Leaf, o as Search, p as Activity, r as Trash2, s as Power, t as X, u as Gauge } from "../_libs/lucide-react.mjs";
import { a as fmtMs, c as fmtTps, i as fmtBytes, l as fmtUsd, n as clamp, o as fmtNum, r as cn, s as fmtPct } from "./router-DexoqVMW.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { a as Area, c as ReferenceLine, i as XAxis, l as ResponsiveContainer, n as LineChart, o as Line, r as YAxis, s as CartesianGrid, t as AreaChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-l-6b6DR3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Button({ variant = "primary", className, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn("inline-flex h-11 items-center justify-center gap-2 rounded-sm px-3.5 text-sm font-medium", "transition-[transform,background-color,color,opacity] duration-150 ease-out", "active:not-disabled:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40", variant === "primary" && "bg-accent text-accent-fg hover:bg-ink", variant === "ghost" && "bg-ink/10 text-ink hover:bg-ink/16", variant === "quiet" && "bg-transparent text-muted hover:bg-ink/10 hover:text-ink", className),
		...props
	});
}
async function runBench(opts) {
	const res = await fetch("/api/bench", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			prompt: opts.prompt,
			model: opts.model,
			maxTokens: opts.maxTokens ?? 96
		}),
		signal: opts.signal
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
		throw new Error(err.error || `HTTP ${res.status}`);
	}
	if (!res.body) throw new Error("No stream");
	const reader = res.body.getReader();
	const dec = new TextDecoder();
	let buf = "";
	let metrics = null;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buf += dec.decode(value, { stream: true });
		const chunks = buf.split("\n\n");
		buf = chunks.pop() ?? "";
		for (const block of chunks) {
			const line = block.split("\n").find((l) => l.startsWith("data:"));
			if (!line) continue;
			const payload = JSON.parse(line.slice(5).trim());
			if (payload.type === "start") opts.live?.onStart?.(payload.model);
			if (payload.type === "token") opts.live?.onToken(payload.text);
			if (payload.type === "error") throw new Error(payload.error);
			if (payload.type === "done") metrics = {
				...payload.metrics,
				id: crypto.randomUUID(),
				at: Date.now(),
				model: payload.metrics.model
			};
		}
	}
	if (!metrics) throw new Error("Incomplete bench stream");
	return metrics;
}
var DEFAULTS = {
	telemetry: {
		id: "telemetry",
		x: 124,
		y: 28,
		w: 900,
		h: 600
	},
	bench: {
		id: "bench",
		x: 150,
		y: 48,
		w: 700,
		h: 540
	},
	eval: {
		id: "eval",
		x: 168,
		y: 40,
		w: 740,
		h: 560
	},
	hardware: {
		id: "hardware",
		x: 140,
		y: 44,
		w: 780,
		h: 540
	},
	cost: {
		id: "cost",
		x: 160,
		y: 56,
		w: 680,
		h: 520
	},
	settings: {
		id: "settings",
		x: 200,
		y: 64,
		w: 480,
		h: 500
	},
	recycle: {
		id: "recycle",
		x: 220,
		y: 80,
		w: 400,
		h: 300
	}
};
function bump(win, z) {
	return {
		...win,
		z,
		minimized: false
	};
}
var useDesk = create()(persist((set, get) => ({
	windows: [{
		...DEFAULTS.telemetry,
		z: 20,
		minimized: false,
		maximized: false
	}],
	focused: "telemetry",
	startOpen: false,
	flyout: "none",
	asleep: false,
	search: "",
	zTop: 20,
	settings: {
		model: DEFAULT_MODEL,
		gpu: "h100",
		kwhUsd: .14,
		carbonGPerKwh: 385
	},
	history: [],
	quality: null,
	liveText: "",
	liveRunning: false,
	liveError: null,
	host: null,
	notice: null,
	openApp: (id) => {
		const { windows, zTop } = get();
		const existing = windows.find((w) => w.id === id);
		const z = zTop + 1;
		if (existing) {
			set({
				windows: windows.map((w) => w.id === id ? bump(w, z) : w),
				focused: id,
				zTop: z,
				startOpen: false
			});
			return;
		}
		set({
			windows: [...windows, {
				...DEFAULTS[id],
				z,
				minimized: false,
				maximized: false
			}],
			focused: id,
			zTop: z,
			startOpen: false
		});
	},
	closeApp: (id) => {
		const windows = get().windows.filter((w) => w.id !== id);
		set({
			windows,
			focused: windows.at(-1)?.id ?? null
		});
	},
	focusApp: (id) => {
		const z = get().zTop + 1;
		set({
			windows: get().windows.map((w) => w.id === id ? {
				...w,
				z,
				minimized: false
			} : w),
			focused: id,
			zTop: z,
			startOpen: false,
			flyout: "none"
		});
	},
	toggleMin: (id) => {
		const win = get().windows.find((w) => w.id === id);
		if (!win) return;
		if (win.minimized) {
			get().focusApp(id);
			return;
		}
		const rest = get().windows.filter((w) => w.id !== id && !w.minimized);
		set({
			windows: get().windows.map((w) => w.id === id ? {
				...w,
				minimized: true
			} : w),
			focused: rest.sort((a, b) => b.z - a.z)[0]?.id ?? null
		});
	},
	toggleMax: (id) => {
		set({
			windows: get().windows.map((w) => w.id === id ? {
				...w,
				maximized: !w.maximized,
				minimized: false
			} : w),
			focused: id
		});
	},
	moveApp: (id, x, y) => {
		set({ windows: get().windows.map((w) => w.id === id ? {
			...w,
			x,
			y
		} : w) });
	},
	resizeApp: (id, w, h) => {
		set({ windows: get().windows.map((win) => win.id === id ? {
			...win,
			w: Math.max(360, w),
			h: Math.max(240, h)
		} : win) });
	},
	setStart: (open) => set({
		startOpen: open,
		flyout: open ? "none" : get().flyout
	}),
	setFlyout: (f) => set({
		flyout: f,
		startOpen: false
	}),
	setAsleep: (v) => set({
		asleep: v,
		startOpen: false,
		flyout: "none"
	}),
	setSearch: (v) => set({ search: v }),
	patchSettings: (p) => set({ settings: {
		...get().settings,
		...p
	} }),
	pushRun: (m) => set({
		history: [m, ...get().history].slice(0, 40),
		notice: `Probe complete · ${m.outputTps.toFixed(1)} t/s · TTFT ${Math.round(m.ttftMs)} ms`
	}),
	setQuality: (q) => set({ quality: q }),
	setLive: (p) => set({
		liveText: p.text ?? get().liveText,
		liveRunning: p.running ?? get().liveRunning,
		liveError: p.error === void 0 ? get().liveError : p.error
	}),
	setHost: (h) => set({ host: h }),
	setNotice: (n) => set({ notice: n }),
	clearHistory: () => set({
		history: [],
		quality: null,
		notice: "History cleared"
	})
}), {
	name: "helix-desk-v1",
	skipHydration: true,
	partialize: (s) => ({
		settings: s.settings,
		history: s.history,
		quality: s.quality
	})
}));
function Tile({ label, value, hint, tone = "ink" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-ink/5 px-3 py-3 shadow-[var(--shadow-border,0_0_0_1px_rgb(255_255_255/0.06))]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] font-medium tracking-wide text-muted uppercase",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("mt-1 font-mono text-xl tabular leading-tight tracking-tight", tone === "ok" && "text-ok", tone === "warn" && "text-warn", tone === "bad" && "text-bad", tone === "ink" && "text-ink"),
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-faint",
				children: hint
			}) : null
		]
	});
}
function Section({ title, action, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-medium text-ink",
				children: title
			}), action]
		}), children]
	});
}
function Bar({ label, value, display, max = 100 }) {
	const pct = Math.min(100, Math.max(0, value / max * 100));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3 text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono tabular text-ink",
				children: display
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-1.5 overflow-hidden rounded-full bg-ink/10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full rounded-full bg-accent transition-[width] duration-500 ease-out",
				style: { width: `${pct}%` }
			})
		})]
	});
}
function Note({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs leading-relaxed text-faint",
		children
	});
}
var PRESETS = [
	{
		name: "Latency",
		prompt: "In two short sentences, define time-to-first-token and time-per-output-token for large language models.",
		max: 80
	},
	{
		name: "Throughput",
		prompt: "List twelve concise techniques that improve LLM decode throughput. One line each, no preamble.",
		max: 160
	},
	{
		name: "Cache",
		prompt: "Explain how a transformer KV cache grows with context length, why fragmentation appears in paged attention, and how prefix caching raises hit rate. Three short paragraphs.",
		max: 180
	}
];
function BenchApp() {
	const settings = useDesk((s) => s.settings);
	const liveText = useDesk((s) => s.liveText);
	const liveRunning = useDesk((s) => s.liveRunning);
	const liveError = useDesk((s) => s.liveError);
	const last = useDesk((s) => s.history[0]);
	const [prompt, setPrompt] = (0, import_react.useState)(PRESETS[0].prompt);
	const [maxTokens, setMaxTokens] = (0, import_react.useState)(96);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col gap-4 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold tracking-tight",
				children: "Bench Lab"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-0.5 text-sm text-muted",
				children: [
					"Stream a prompt against ",
					settings.model,
					". TTFT, TPOT, and t/s are measured on the server."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "h-10",
					onClick: () => {
						setPrompt(p.prompt);
						setMaxTokens(p.max);
					},
					children: p.name
				}, p.name))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium text-muted",
					children: "Prompt"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: prompt,
					onChange: (e) => setPrompt(e.target.value),
					rows: 5,
					maxLength: 4e3,
					className: "w-full resize-none rounded-md bg-dusk px-3 py-2.5 text-sm leading-relaxed text-ink outline-none ring-1 ring-ink/10 focus:ring-accent/50"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-sm text-muted",
					children: ["Max tokens", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						min: 16,
						max: 256,
						value: maxTokens,
						onChange: (e) => setMaxTokens(Number(e.target.value)),
						className: "h-11 w-20 rounded-sm bg-dusk px-2 font-mono text-ink outline-none ring-1 ring-ink/10"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: liveRunning || prompt.trim().length === 0,
					onClick: () => void run(prompt, maxTokens),
					children: liveRunning ? "Streaming…" : "Run bench"
				})]
			}),
			liveError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: liveError
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Stream",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "win-scroll max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-dusk px-3 py-2.5 font-mono text-xs leading-relaxed text-ink/90",
					children: liveText || (liveRunning ? "Waiting for first token…" : "Output appears here.")
				})
			}),
			last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "TTFT",
						value: fmtMs(last.ttftMs)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "TPOT",
						value: fmtMs(last.tpotMs)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Output t/s",
						value: fmtTps(last.outputTps)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Prompt t/s",
						value: fmtTps(last.promptTps),
						hint: "prompt tokens / TTFT"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Tokens",
						value: `${fmtNum(last.promptTokens, 0)} → ${fmtNum(last.completionTokens, 0)}`,
						hint: `cache hit ${fmtPct(last.cacheHitPct)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Cost",
						value: fmtUsd(last.costUsd)
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: "Prompt processing throughput is tokens in the prompt divided by TTFT. On a hosted API that includes queueing, so treat it as a lower bound." })
		]
	});
}
async function run(prompt, maxTokens) {
	const { settings, setLive, pushRun } = useDesk.getState();
	if (useDesk.getState().liveRunning) return;
	setLive({
		running: true,
		text: "",
		error: null
	});
	try {
		const metrics = await runBench({
			prompt,
			model: settings.model,
			maxTokens,
			live: { onToken: (piece) => setLive({ text: useDesk.getState().liveText + piece }) }
		});
		setLive({
			running: false,
			text: metrics.outputText
		});
		pushRun(metrics);
	} catch (err) {
		setLive({
			running: false,
			error: err instanceof Error ? err.message : "Bench failed"
		});
	}
}
function kvBytesPerToken(arch = SERVING_ARCH) {
	return 2 * arch.nLayers * arch.nKvHeads * arch.headDim * arch.bytes;
}
function kvCacheBytes(seqLen, batch = 1, arch = SERVING_ARCH) {
	return kvBytesPerToken(arch) * seqLen * batch;
}
function activationBytes(seqLen, batch = 1, arch = SERVING_ARCH) {
	return 2 * arch.hiddenSize * seqLen * batch * arch.bytes;
}
function peakVramBytes(seqLen, batch = 1, arch = SERVING_ARCH) {
	return arch.weightGB * 1024 ** 3 + kvCacheBytes(seqLen, batch, arch) + activationBytes(seqLen, batch, arch);
}
var PAGE = 2097152;
function kvFragmentation(seqLen, batch = 1) {
	const used = kvCacheBytes(seqLen, batch);
	const pages = Math.ceil(used / PAGE);
	const allocated = pages * PAGE;
	const waste = allocated - used;
	return {
		used,
		allocated,
		waste,
		wastePct: allocated === 0 ? 0 : waste / allocated * 100,
		pages
	};
}
function smEfficiency(tokensPerSec, seqLen, gpuId) {
	const gpu = gpuMeta(gpuId);
	const required = tokensPerSec * (kvBytesPerToken() + SERVING_ARCH.hiddenSize * SERVING_ARCH.bytes);
	const bandwidth = gpu.bandwidthTBps * 0xe8d4a51000;
	const memBound = bandwidth === 0 ? 0 : required / bandwidth * 100;
	const decodeUtil = Math.min(96, Math.max(8, memBound * 14));
	return {
		smPct: decodeUtil,
		memBoundPct: Math.min(100, memBound * 100),
		note: decodeUtil < 45 ? "Low SM activity — decode is waiting on memory bandwidth or host transfer." : "Cores are busy; remaining slack is typical of memory-bound decode."
	};
}
function energyKwh(durationMs, gpuId, utilPct) {
	return gpuMeta(gpuId).tdpW * (utilPct / 100) * (durationMs / 1e3) / 3600 / 1e3;
}
function carbonG(kwh, gPerKwh) {
	return kwh * gPerKwh;
}
function CostApp() {
	const history = useDesk((s) => s.history);
	const settings = useDesk((s) => s.settings);
	const last = history[0];
	const gpu = gpuMeta(settings.gpu);
	const model = modelMeta(settings.model);
	const spend = history.reduce((a, r) => a + r.costUsd, 0);
	const tokens = history.reduce((a, r) => a + r.promptTokens + r.completionTokens, 0);
	const sm = last ? smEfficiency(last.outputTps, last.promptTokens + last.completionTokens, settings.gpu) : null;
	const kwh = last ? energyKwh(last.totalMs, settings.gpu, sm?.smPct ?? 40) : 0;
	const gCo2 = carbonG(kwh, settings.carbonGPerKwh);
	const tokLast = last ? last.completionTokens + last.promptTokens : 0;
	const per1k = last && tokLast ? last.costUsd / (tokLast / 1e3) : 0;
	const watts = gpu.tdpW * ((sm?.smPct ?? 40) / 100);
	const energyPer1kTok = last && tokLast ? kwh / tokLast * 1e3 : 0;
	const chart = [...history].reverse().map((r, i) => ({
		i: i + 1,
		usd: r.costUsd,
		cum: 0
	}));
	let acc = 0;
	for (const row of chart) {
		acc += row.usd;
		row.cum = acc;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold tracking-tight",
				children: "Cost Ledger"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-0.5 text-sm text-muted",
				children: [
					"API invoice plus an energy model for a ",
					gpu.name,
					" at ",
					model.label,
					" list prices."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Last request",
						value: fmtUsd(last?.costUsd)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Session",
						value: fmtUsd(spend),
						hint: `${history.length} runs`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "$ / 1K tok",
						value: fmtUsd(per1k)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "List / 1M",
						value: `$${model.inputPerM} / $${model.outputPerM}`,
						hint: `cache $${model.cachedPerM}`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Draw",
						value: `${Math.round(watts)} W`,
						hint: `${gpu.tdpW} W TDP × util`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Energy / 1K",
						value: energyPer1kTok < 1e-6 ? "—" : `${energyPer1kTok.toExponential(2)} kWh`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Last kWh",
						value: kwh ? kwh.toExponential(2) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Carbon",
						value: !gCo2 ? "—" : `${gCo2 < .01 ? gCo2.toExponential(2) : gCo2.toFixed(3)} g`,
						hint: `${settings.carbonGPerKwh} g/kWh grid`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Spend over runs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-40 rounded-md bg-ink/5 p-2",
					children: chart.length < 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-full items-center justify-center text-sm text-faint",
						children: "Two or more benches plot cumulative spend."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
							data: chart,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "rgb(243 244 246 / 0.06)",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "i",
									hide: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									contentStyle: {
										background: "var(--color-mica)",
										border: "1px solid rgb(255 255 255 / 0.1)",
										borderRadius: 8,
										fontSize: 12
									},
									formatter: (v) => fmtUsd(Number(v))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "cum",
									stroke: "var(--color-accent)",
									fill: "var(--color-accent)",
									fillOpacity: .12,
									name: "Cumulative"
								})
							]
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Note, { children: [
				"Financial cost uses the API invoice when present, otherwise ",
				model.label,
				" list rates. Energy assumes one ",
				gpu.name,
				" at estimated SM util, electricity ",
				fmtUsd(settings.kwhUsd),
				"/kWh. Self-hosting amortization is not included. Session total: ",
				fmtNum(tokens, 0),
				" tokens."
			] })
		]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var runEvalSuite = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("a88cc7d4b39ffdfbb64eecc6eaed2f41226f281c8d1accde7a01385783b63d7a"));
var SUITES = [
	{
		id: "mmlu",
		title: "MMLU slice",
		blurb: "Six multiple-choice items across science, CS, and humanities."
	},
	{
		id: "gsm8k",
		title: "GSM8K slice",
		blurb: "Five grade-school word problems, numeric answers."
	},
	{
		id: "humaneval",
		title: "HumanEval slice",
		blurb: "Three tiny JavaScript functions, executed against tests."
	},
	{
		id: "rag",
		title: "RAG trio",
		blurb: "Context precision, faithfulness, and answer relevance on a fixed corpus."
	}
];
function EvalApp() {
	const quality = useDesk((s) => s.quality);
	const settings = useDesk((s) => s.settings);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [log, setLog] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	async function run(suite) {
		if (busy) return;
		setBusy(suite);
		setError(null);
		try {
			const result = await runEvalSuite({ data: {
				suite,
				model: settings.model
			} });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			applyQuality(result);
			setLog((l) => [
				`${result.suite}: ${result.passed}/${result.total} · ${fmtPct(result.score * 100)} · ${fmtUsd(result.costUsd)}`,
				...result.notes.slice(0, 6),
				...l
			].slice(0, 24));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Eval failed");
		} finally {
			setBusy(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold tracking-tight",
				children: "Eval Suite"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-sm text-muted",
				children: "Compact, user-started slices — not the full public leaderboards. Each click is one API round."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "MMLU",
						value: quality?.mmlu != null ? fmtPct(quality.mmlu * 100) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "GSM8K",
						value: quality?.gsm8k != null ? fmtPct(quality.gsm8k * 100) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "HumanEval",
						value: quality?.humanEval != null ? fmtPct(quality.humanEval * 100) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Entropy",
						value: quality?.perplexityProxy != null ? quality.perplexityProxy.toFixed(2) : "—",
						hint: "bits/char (PPL proxy)"
					})
				]
			}),
			quality?.rag ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Ctx precision",
						value: fmtPct(quality.rag.contextPrecision * 100)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Faithfulness",
						value: fmtPct(quality.rag.faithfulness * 100)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Relevance",
						value: fmtPct(quality.rag.answerRelevance * 100)
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Run a slice",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-2",
					children: SUITES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 rounded-md bg-ink/5 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: s.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-faint",
							children: s.blurb
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "h-10 shrink-0",
							disabled: Boolean(busy),
							onClick: () => void run(s.id),
							children: busy === s.id ? "Running…" : "Run"
						})]
					}, s.id))
				})
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Notes",
				children: log.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: "True perplexity needs token log-probs, which this API does not return. Bits-per-character of the model’s own output is shown as a stand-in, next to task accuracy." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "win-scroll max-h-36 space-y-1 overflow-auto font-mono text-xs text-muted",
					children: log.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, `${i}-${line}`))
				})
			})
		]
	});
}
function applyQuality(result) {
	const prev = useDesk.getState().quality;
	const next = {
		at: Date.now(),
		model: result.model,
		mmlu: prev?.mmlu ?? null,
		gsm8k: prev?.gsm8k ?? null,
		humanEval: prev?.humanEval ?? null,
		perplexityProxy: result.entropyBpc ?? prev?.perplexityProxy ?? null,
		rag: prev?.rag ?? null,
		details: {
			suite: result.suite,
			passed: result.passed,
			total: result.total,
			notes: result.notes
		}
	};
	if (result.suite === "mmlu") next.mmlu = result.score;
	if (result.suite === "gsm8k") next.gsm8k = result.score;
	if (result.suite === "humaneval") next.humanEval = result.score;
	if (result.suite === "rag" && result.extra) next.rag = {
		contextPrecision: result.extra.contextPrecision,
		faithfulness: result.extra.faithfulness,
		answerRelevance: result.extra.answerRelevance
	};
	useDesk.getState().setQuality(next);
}
var TICK = {
	fill: "var(--color-muted)",
	fontSize: 11
};
var TIP$1 = {
	background: "var(--color-mica)",
	border: "1px solid rgb(255 255 255 / 0.1)",
	borderRadius: 8,
	fontSize: 12
};
function HardwareApp() {
	const settings = useDesk((s) => s.settings);
	const last = useDesk((s) => s.history[0]);
	const host = useDesk((s) => s.host);
	const [ctxK, setCtxK] = (0, import_react.useState)(8);
	const gpu = gpuMeta(settings.gpu);
	const seq = ctxK * 1024;
	const kv = kvCacheBytes(seq);
	const peak = peakVramBytes(seq);
	const frag = kvFragmentation(seq);
	const sm = last ? smEfficiency(last.outputTps, last.promptTokens + last.completionTokens, settings.gpu) : null;
	const series = (0, import_react.useMemo)(() => [
		1,
		2,
		4,
		8,
		16,
		32,
		64,
		128
	].map((k) => ({
		k,
		kvGB: kvCacheBytes(k * 1024) / 1024 ** 3,
		peakGB: peakVramBytes(k * 1024) / 1024 ** 3
	})), []);
	const heapPct = host?.heapUsed && host.heapLimit ? host.heapUsed / host.heapLimit * 100 : 0;
	const pages = Math.min(48, Math.max(8, frag.pages));
	const wastePages = Math.max(0, Math.round(frag.wastePct / 100 * 12));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold tracking-tight",
				children: "Hardware"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-0.5 text-sm text-muted",
				children: [
					"KV, VRAM, and SM estimates for a ",
					gpu.name,
					" serving ",
					SERVING_ARCH.label.toLowerCase(),
					"."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Context length" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono tabular text-ink",
						children: [fmtNum(seq, 0), " tok"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 1,
					max: 128,
					value: ctxK,
					onChange: (e) => setCtxK(Number(e.target.value)),
					className: "w-full accent-accent"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "KV cache",
						value: fmtBytes(kv),
						hint: `${fmtBytes(kvBytesPerToken())}/tok`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Peak VRAM",
						value: fmtBytes(peak),
						hint: `budget ${gpu.vramGB} GB`,
						tone: peak / 1024 ** 3 > gpu.vramGB ? "bad" : "ink"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Frag waste",
						value: fmtPct(frag.wastePct),
						hint: `${fmtBytes(frag.waste)} in 2 MB pages`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Weights",
						value: `${SERVING_ARCH.weightGB} GB`,
						hint: "Estimated resident experts"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "KV vs context",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-44 rounded-md bg-ink/5 p-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data: series,
							margin: {
								top: 8,
								right: 8,
								left: 0,
								bottom: 0
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "rgb(243 244 246 / 0.06)",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "k",
									tick: TICK,
									unit: "k"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									tick: TICK,
									unit: " GB",
									width: 48
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: TIP$1 }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReferenceLine, {
									y: gpu.vramGB,
									stroke: "var(--color-bad)",
									strokeDasharray: "4 4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "kvGB",
									stroke: "var(--color-accent)",
									dot: false,
									name: "KV GB"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "peakGB",
									stroke: "var(--color-warn)",
									dot: false,
									name: "Peak GB"
								})
							]
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Paged KV map",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1",
					children: Array.from({ length: pages }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-3 w-3 rounded-[2px] ${i >= pages - wastePages ? "bg-warn/70" : "bg-accent/80"}` }, i))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: "Steel cells are occupied KV pages. Amber is alignment waste from 2 MB paging." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "CUDA / SM (estimate)",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							label: "SM activity",
							value: sm?.smPct ?? 0,
							display: fmtPct(sm?.smPct)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							label: "Memory-bound",
							value: sm?.memBoundPct ?? 0,
							display: fmtPct(sm?.memBoundPct)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: sm?.note ?? "Run a bench to estimate SM efficiency from measured t/s and GPU bandwidth." })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "This workstation",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							label: "JS heap",
							value: heapPct,
							display: host?.heapUsed ? `${fmtBytes(host.heapUsed)} / ${fmtBytes(host.heapLimit)}` : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							label: "CPU cores",
							value: host?.cores ?? 0,
							max: Math.max(16, host?.cores ?? 16),
							display: host?.cores ? String(host.cores) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: host?.gpuName ? `Client GPU: ${host.gpuName}. Host RAM ${host.deviceMemoryGb ? `${host.deviceMemoryGb} GB` : "unknown"}.` : "Client GPU name is hidden unless WebGPU is available. Heap is the tokenizer / UI process, not model weights." })
					]
				})]
			})
		]
	});
}
function SettingsApp() {
	const settings = useDesk((s) => s.settings);
	const patch = useDesk((s) => s.patchSettings);
	const clearHistory = useDesk((s) => s.clearHistory);
	const history = useDesk((s) => s.history);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold tracking-tight",
				children: "Settings"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-sm text-muted",
				children: "Model, serving GPU, and energy assumptions."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Model",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: settings.model,
					onChange: (e) => patch({ model: e.target.value }),
					className: "h-11 w-full rounded-sm bg-dusk px-3 text-sm text-ink outline-none ring-1 ring-ink/10",
					children: MODELS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: m.id,
						children: [
							m.label,
							" · $",
							m.inputPerM,
							"/$",
							m.outputPerM,
							" per 1M"
						]
					}, m.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Serving GPU (estimates)",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: settings.gpu,
					onChange: (e) => patch({ gpu: e.target.value }),
					className: "h-11 w-full rounded-sm bg-dusk px-3 text-sm text-ink outline-none ring-1 ring-ink/10",
					children: GPU_PROFILES.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: g.id,
						children: [
							g.name,
							" · ",
							g.tdpW,
							" W · ",
							g.vramGB,
							" GB"
						]
					}, g.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: "Used for KV / VRAM / watt math. The hosted API does not expose cluster GPUs." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Energy",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Electricity ($/kWh)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						step: "0.01",
						min: 0,
						value: settings.kwhUsd,
						onChange: (e) => patch({ kwhUsd: Number(e.target.value) }),
						className: "h-11 w-full rounded-sm bg-dusk px-3 font-mono text-ink outline-none ring-1 ring-ink/10"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block space-y-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Grid carbon (g CO₂ / kWh)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						step: "1",
						min: 0,
						value: settings.carbonGPerKwh,
						onChange: (e) => patch({ carbonGPerKwh: Number(e.target.value) }),
						className: "h-11 w-full rounded-sm bg-dusk px-3 font-mono text-ink outline-none ring-1 ring-ink/10"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Session",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [history.length, " stored benches on this device."]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: clearHistory,
					children: "Clear history"
				})]
			})
		]
	});
}
function RecycleApp() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col items-center justify-center gap-2 p-8 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-medium",
			children: "Recycle Bin is empty"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-xs text-xs text-faint",
			children: "Closed windows are not discarded. Reopen them from the desktop or Start."
		})]
	});
}
var PROBE = "In two short sentences, define time-to-first-token and time-per-output-token for large language models.";
var TIP = {
	background: "var(--color-mica)",
	border: "1px solid rgb(255 255 255 / 0.1)",
	borderRadius: 8,
	fontSize: 12
};
function TelemetryApp() {
	const history = useDesk((s) => s.history);
	const quality = useDesk((s) => s.quality);
	const settings = useDesk((s) => s.settings);
	const liveRunning = useDesk((s) => s.liveRunning);
	const openApp = useDesk((s) => s.openApp);
	const last = history[0];
	const gpu = gpuMeta(settings.gpu);
	const seq = last ? last.promptTokens + last.completionTokens : 4096;
	const kv = kvCacheBytes(seq);
	const peak = peakVramBytes(seq);
	const sm = last ? smEfficiency(last.outputTps, seq, settings.gpu) : null;
	const chart = [...history].reverse().map((r, i) => ({
		i: i + 1,
		ttft: r.ttftMs,
		tps: r.outputTps,
		tpot: r.tpotMs
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold tracking-tight",
					children: "LLM telemetry"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-0.5 text-sm text-muted",
					children: ["Live speed, memory, quality, and cost for ", settings.model]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: liveRunning,
						onClick: () => void probe(),
						children: liveRunning ? "Probing…" : "Quick probe"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => openApp("bench"),
						children: "Bench Lab"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "TTFT",
						value: fmtMs(last?.ttftMs),
						hint: "Request → first token",
						tone: last && last.ttftMs < 800 ? "ok" : last ? "warn" : "ink"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Output",
						value: fmtTps(last?.outputTps),
						hint: "Generation throughput"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "TPOT",
						value: fmtMs(last?.tpotMs),
						hint: "Avg. inter-token time"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Prompt",
						value: fmtTps(last?.promptTps),
						hint: "Tokens / TTFT (incl. queue)"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Latency across runs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-40 rounded-md bg-ink/5 p-2",
					children: chart.length < 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyChart, { text: "Run two probes to plot TTFT and throughput." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
							data: chart,
							margin: {
								top: 8,
								right: 8,
								left: 0,
								bottom: 0
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "rgb(243 244 246 / 0.06)",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "i",
									hide: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { hide: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									contentStyle: TIP,
									labelFormatter: (v) => `Run ${String(v)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "ttft",
									stroke: "var(--color-accent)",
									fill: "var(--color-accent)",
									fillOpacity: .12,
									name: "TTFT ms"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "tps",
									stroke: "var(--color-ok)",
									fill: "var(--color-ok)",
									fillOpacity: .08,
									name: "t/s"
								})
							]
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Memory & hardware",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
								label: "KV cache",
								value: fmtBytes(kv),
								hint: `${seq.toLocaleString()} tokens`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
								label: "Peak VRAM",
								value: fmtBytes(peak),
								hint: `${gpu.name} · estimate`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
								label: "SM / GPU",
								value: fmtPct(sm?.smPct),
								hint: gpu.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
								label: "Cache hit",
								value: fmtPct(last?.cacheHitPct),
								hint: last ? `${last.cachedTokens} cached` : "Prompt cache"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: "VRAM and SM figures are serving estimates (weights + KV + activations). CUDA counters are not exposed by the API." })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Quality & cost",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
								label: "MMLU",
								value: quality?.mmlu != null ? fmtPct(quality.mmlu * 100) : "—",
								hint: "General knowledge"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
								label: "GSM8K",
								value: quality?.gsm8k != null ? fmtPct(quality.gsm8k * 100) : "—",
								hint: "Grade-school math"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
								label: "HumanEval",
								value: quality?.humanEval != null ? fmtPct(quality.humanEval * 100) : "—",
								hint: "Coding tests"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
								label: "Last cost",
								value: fmtUsd(last?.costUsd),
								hint: last ? `${last.promptTokens}+${last.completionTokens} tok` : "Per request"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2 pt-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "h-10",
								onClick: () => openApp("eval"),
								children: "Run evals"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "quiet",
								className: "h-10",
								onClick: () => openApp("hardware"),
								children: "Hardware"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "quiet",
								className: "h-10",
								onClick: () => openApp("cost"),
								children: "Cost ledger"
							})
						]
					})]
				})]
			})
		]
	});
}
function EmptyChart({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center px-4 text-center text-sm text-faint",
		children: text
	});
}
async function probe() {
	const { settings, setLive, pushRun, openApp } = useDesk.getState();
	if (useDesk.getState().liveRunning) return;
	openApp("bench");
	setLive({
		running: true,
		text: "",
		error: null
	});
	try {
		const metrics = await runBench({
			prompt: PROBE,
			model: settings.model,
			maxTokens: 80,
			live: { onToken: (piece) => {
				setLive({ text: useDesk.getState().liveText + piece });
			} }
		});
		setLive({
			running: false,
			text: metrics.outputText
		});
		pushRun(metrics);
	} catch (err) {
		setLive({
			running: false,
			error: err instanceof Error ? err.message : "Probe failed"
		});
	}
}
var APPS = [
	{
		id: "telemetry",
		title: "Telemetry",
		hint: "Speed, quality, cost",
		icon: Activity,
		View: TelemetryApp,
		pin: true,
		desktop: true
	},
	{
		id: "bench",
		title: "Bench Lab",
		hint: "Stream a live probe",
		icon: Gauge,
		View: BenchApp,
		pin: true,
		desktop: true
	},
	{
		id: "eval",
		title: "Eval Suite",
		hint: "MMLU, math, code, RAG",
		icon: FlaskConical,
		View: EvalApp,
		pin: true,
		desktop: true
	},
	{
		id: "hardware",
		title: "Hardware",
		hint: "VRAM, KV, SM, host",
		icon: Cpu,
		View: HardwareApp,
		pin: true,
		desktop: true
	},
	{
		id: "cost",
		title: "Cost Ledger",
		hint: "Dollars, watts, carbon",
		icon: Leaf,
		View: CostApp,
		pin: true,
		desktop: true
	},
	{
		id: "settings",
		title: "Settings",
		hint: "Model and energy",
		icon: Settings2,
		View: SettingsApp,
		pin: false,
		desktop: true
	},
	{
		id: "recycle",
		title: "Recycle Bin",
		hint: "Empty",
		icon: Trash2,
		View: RecycleApp,
		pin: false,
		desktop: true
	}
];
function appMeta(id) {
	return APPS.find((a) => a.id === id) ?? APPS[0];
}
function StartMenu() {
	const search = useDesk((s) => s.search);
	const setSearch = useDesk((s) => s.setSearch);
	const openApp = useDesk((s) => s.openApp);
	const setAsleep = useDesk((s) => s.setAsleep);
	const setStart = useDesk((s) => s.setStart);
	const q = search.trim().toLowerCase();
	const listed = APPS.filter((a) => !q || a.title.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-x-0 bottom-[60px] z-40 flex justify-center px-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto w-full max-w-[560px] origin-bottom rounded-lg bg-mica p-4 shadow-[var(--shadow-window)]",
			role: "dialog",
			"aria-label": "Start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex h-11 items-center gap-2 rounded-sm bg-dusk px-3 ring-1 ring-ink/10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "size-4 text-faint",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: search,
						onChange: (e) => setSearch(e.target.value),
						placeholder: "Search apps",
						className: "h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint",
						autoFocus: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 mb-2 text-xs font-medium tracking-wide text-muted uppercase",
					children: "Pinned"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-2 sm:grid-cols-4",
					children: listed.map((app) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							openApp(app.id);
							setSearch("");
						},
						className: cn("flex flex-col items-center gap-2 rounded-md px-2 py-3 text-center hover:bg-ink/8"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-11 items-center justify-center rounded-sm bg-ink/10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(app.icon, {
								className: "size-5",
								strokeWidth: 1.6
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium",
							children: app.title
						})]
					}, app.id))
				}),
				listed.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-6 text-center text-sm text-faint",
					children: "No matching apps"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center justify-between border-t border-hairline pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: "Helix"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex size-11 items-center justify-center rounded-sm text-muted hover:bg-ink/10 hover:text-ink",
						"aria-label": "Sleep",
						onClick: () => {
							setStart(false);
							setAsleep(true);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, {
							className: "size-4",
							strokeWidth: 1.75
						})
					})]
				})
			]
		})
	});
}
function HelixMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className,
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "2.5",
				y: "2.5",
				width: "19",
				height: "19",
				rx: "4",
				stroke: "currentColor",
				strokeWidth: "1.5",
				opacity: "0.9"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M6 15.5c2.2-4.8 4.4-4.8 6.6 0s4.4 4.8 6.4 0",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M6 10.5c2.2-4.2 4.4-4.2 6.6 0s4.4 4.2 6.4 0",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round",
				opacity: "0.45"
			})
		]
	});
}
function Taskbar({ now }) {
	const windows = useDesk((s) => s.windows);
	const focused = useDesk((s) => s.focused);
	const startOpen = useDesk((s) => s.startOpen);
	const flyout = useDesk((s) => s.flyout);
	const openApp = useDesk((s) => s.openApp);
	const toggleMin = useDesk((s) => s.toggleMin);
	const setStart = useDesk((s) => s.setStart);
	const setFlyout = useDesk((s) => s.setFlyout);
	const notice = useDesk((s) => s.notice);
	const last = useDesk((s) => s.history[0]);
	const running = new Set(windows.map((w) => w.id));
	const pins = APPS.filter((a) => a.pin);
	const extras = windows.filter((w) => !pins.some((p) => p.id === w.id));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto relative flex h-14 w-full max-w-[920px] items-center gap-1 rounded-md bg-taskbar px-1.5 shadow-[var(--shadow-window)] backdrop-blur-xl md:h-12 md:w-auto md:min-w-[540px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Start",
					onClick: () => setStart(!startOpen),
					className: cn("flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-150 md:size-10", startOpen ? "bg-ink/12" : "hover:bg-ink/10"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelixMark, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Search",
					onClick: () => setStart(true),
					className: "hidden size-10 items-center justify-center rounded-sm text-muted hover:bg-ink/10 hover:text-ink sm:flex",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "size-4",
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-1 h-5 w-px bg-hairline" }),
				pins.map((app) => {
					const open = running.has(app.id);
					const isFocused = focused === app.id && open;
					const minimized = windows.find((w) => w.id === app.id)?.minimized;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						title: app.title,
						onClick: () => {
							if (!open) openApp(app.id);
							else if (isFocused && !minimized) toggleMin(app.id);
							else openApp(app.id);
						},
						className: cn("relative flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-150 md:size-10", isFocused ? "bg-ink/14" : "hover:bg-ink/10"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(app.icon, {
							className: "size-4",
							strokeWidth: 1.75
						}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full", isFocused ? "bg-accent" : "bg-muted") }) : null]
					}, app.id);
				}),
				extras.map((w) => {
					const meta = appMeta(w.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						title: meta.title,
						onClick: () => openApp(w.id),
						className: cn("relative flex size-11 items-center justify-center rounded-sm hover:bg-ink/10 md:size-10", focused === w.id ? "bg-ink/14" : ""),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(meta.icon, {
							className: "size-4",
							strokeWidth: 1.75
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-accent" })]
					}, w.id);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center pl-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setFlyout(flyout === "tray" ? "none" : "tray"),
						className: cn("hidden h-10 rounded-sm px-2 text-left sm:block", flyout === "tray" ? "bg-ink/12" : "hover:bg-ink/10"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-xs tabular leading-tight text-ink",
							children: last ? `${last.outputTps.toFixed(0)} t/s` : "idle"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-faint",
							children: notice ? "notice" : "GPU est."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setFlyout(flyout === "clock" ? "none" : "clock"),
						className: cn("h-11 min-w-[4.5rem] rounded-sm px-2 text-right md:h-10", flyout === "clock" ? "bg-ink/12" : "hover:bg-ink/10"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-xs tabular leading-tight",
							children: now.toLocaleTimeString(void 0, {
								hour: "numeric",
								minute: "2-digit"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-faint",
							children: now.toLocaleDateString(void 0, {
								month: "short",
								day: "numeric"
							})
						})]
					})]
				}),
				flyout === "clock" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockFlyout, { now }) : null,
				flyout === "tray" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrayFlyout, {}) : null
			]
		})
	});
}
function ClockFlyout({ now }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute right-2 bottom-[calc(100%+8px)] w-64 rounded-md bg-mica p-4 shadow-[var(--shadow-window)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-mono text-3xl tabular tracking-tight",
			children: now.toLocaleTimeString(void 0, {
				hour: "numeric",
				minute: "2-digit",
				second: "2-digit"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 text-sm text-muted",
			children: now.toLocaleDateString(void 0, {
				weekday: "long",
				month: "long",
				day: "numeric"
			})
		})]
	});
}
function TrayFlyout() {
	const last = useDesk((s) => s.history[0]);
	const notice = useDesk((s) => s.notice);
	const setNotice = useDesk((s) => s.setNotice);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute right-16 bottom-[calc(100%+8px)] w-72 rounded-md bg-mica p-4 shadow-[var(--shadow-window)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "System"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs leading-relaxed text-muted",
				children: notice ?? "No alerts. Run a probe to fill telemetry."
			}),
			last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 font-mono text-xs text-faint",
				children: [
					last.model,
					" · TTFT ",
					Math.round(last.ttftMs),
					" ms · ",
					last.outputTps.toFixed(1),
					" t/s"
				]
			}) : null,
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-3 text-xs text-accent hover:text-ink",
				onClick: () => setNotice(null),
				children: "Dismiss"
			}) : null
		]
	});
}
function WindowFrame({ win }) {
	const focused = useDesk((s) => s.focused === win.id);
	const focusApp = useDesk((s) => s.focusApp);
	const closeApp = useDesk((s) => s.closeApp);
	const toggleMin = useDesk((s) => s.toggleMin);
	const toggleMax = useDesk((s) => s.toggleMax);
	const moveApp = useDesk((s) => s.moveApp);
	const resizeApp = useDesk((s) => s.resizeApp);
	const meta = appMeta(win.id);
	const View = meta.View;
	const drag = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("desk-window absolute z-20 flex flex-col overflow-hidden bg-mica text-ink shadow-[var(--shadow-window)]", win.maximized ? "inset-0 h-full w-full rounded-none" : "rounded-lg max-tab:inset-0 max-tab:h-full max-tab:w-full max-tab:rounded-none", win.minimized && "pointer-events-none hidden"),
		style: win.maximized ? { zIndex: win.z } : {
			left: win.x,
			top: win.y,
			width: win.w,
			height: win.h,
			zIndex: win.z
		},
		onPointerDown: () => focusApp(win.id),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: cn("flex h-10 shrink-0 items-center select-none", focused ? "bg-mica-2" : "bg-mica"),
				onPointerDown: (e) => {
					if (win.maximized) return;
					if (e.target.closest("[data-caption]")) return;
					focusApp(win.id);
					drag.current = {
						dx: e.clientX - win.x,
						dy: e.clientY - win.y
					};
					e.currentTarget.setPointerCapture(e.pointerId);
				},
				onPointerMove: (e) => {
					if (!drag.current) return;
					const bounds = e.currentTarget.closest("[data-desktop]")?.getBoundingClientRect();
					const maxX = (bounds?.width ?? 1200) - 80;
					const maxY = (bounds?.height ?? 800) - 48;
					moveApp(win.id, clamp(e.clientX - drag.current.dx, -win.w + 80, maxX), clamp(e.clientY - drag.current.dy, 0, maxY));
				},
				onPointerUp: () => {
					drag.current = null;
				},
				onDoubleClick: () => toggleMax(win.id),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-1 items-center gap-2 pl-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(meta.icon, {
						className: "size-3.5 text-muted",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate text-xs font-medium",
						children: meta.title
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-full",
					"data-caption": true,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptionBtn, {
							label: "Minimize",
							onClick: () => toggleMin(win.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3.5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptionBtn, {
							label: "Maximize",
							onClick: () => toggleMax(win.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptionBtn, {
							label: "Close",
							danger: true,
							onClick: () => closeApp(win.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "win-scroll min-h-0 flex-1 overflow-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(View, {})
			}),
			win.maximized ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute right-0 bottom-0 hidden size-4 cursor-se-resize tab:block",
				onPointerDown: (e) => {
					e.stopPropagation();
					const start = {
						x: e.clientX,
						y: e.clientY,
						w: win.w,
						h: win.h
					};
					const move = (ev) => {
						resizeApp(win.id, start.w + (ev.clientX - start.x), start.h + (ev.clientY - start.y));
					};
					const up = () => {
						window.removeEventListener("pointermove", move);
						window.removeEventListener("pointerup", up);
					};
					window.addEventListener("pointermove", move);
					window.addEventListener("pointerup", up);
				}
			})
		]
	});
}
function CaptionBtn({ children, onClick, danger, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick: (e) => {
			e.stopPropagation();
			onClick();
		},
		className: cn("flex h-full w-11 items-center justify-center text-muted transition-colors duration-150", danger ? "hover:bg-bad hover:text-ink" : "hover:bg-ink/10 hover:text-ink"),
		children
	});
}
async function gpuName() {
	const nav = navigator;
	try {
		const adapter = await nav.gpu?.requestAdapter();
		if (!adapter) return null;
		if (adapter.info?.device) return adapter.info.device;
		if (adapter.info?.description) return adapter.info.description;
		if (adapter.requestAdapterInfo) {
			const info = await adapter.requestAdapterInfo();
			return info.device || info.description || null;
		}
	} catch {
		return null;
	}
	return null;
}
var cachedGpu;
async function sampleHost() {
	if (cachedGpu === void 0) cachedGpu = await gpuName();
	const mem = performance.memory;
	const deviceMemory = navigator.deviceMemory;
	return {
		at: Date.now(),
		heapUsed: mem?.usedJSHeapSize ?? null,
		heapLimit: mem?.jsHeapSizeLimit ?? null,
		cores: navigator.hardwareConcurrency || 0,
		deviceMemoryGb: deviceMemory ?? null,
		gpuName: cachedGpu ?? null
	};
}
function Desktop() {
	const windows = useDesk((s) => s.windows);
	const startOpen = useDesk((s) => s.startOpen);
	const asleep = useDesk((s) => s.asleep);
	const setStart = useDesk((s) => s.setStart);
	const setFlyout = useDesk((s) => s.setFlyout);
	const setAsleep = useDesk((s) => s.setAsleep);
	const openApp = useDesk((s) => s.openApp);
	const setHost = useDesk((s) => s.setHost);
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	const hasOpen = windows.some((w) => !w.minimized);
	(0, import_react.useEffect)(() => {
		useDesk.persist.rehydrate();
		const tick = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		let live = true;
		const hostTick = window.setInterval(() => {
			sampleHost().then((h) => {
				if (live) setHost(h);
			});
		}, 2e3);
		sampleHost().then((h) => {
			if (live) setHost(h);
		});
		return () => {
			live = false;
			window.clearInterval(tick);
			window.clearInterval(hostTick);
		};
	}, [setHost]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full overflow-hidden bg-dusk text-ink",
		"data-open": hasOpen ? "1" : "0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "sr-only",
				children: "Helix LLM desktop"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/wallpaper.jpg",
				alt: "",
				className: "absolute inset-0 size-full object-cover",
				crossOrigin: "anonymous"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-dusk/30" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-desktop": true,
				className: "absolute inset-0 bottom-16",
				onPointerDown: (e) => {
					if (e.target === e.currentTarget) {
						setStart(false);
						setFlyout("none");
					}
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: cn("desk-icons absolute top-3 left-2 z-10 flex flex-col gap-1 p-1", "max-tab:inset-x-2 max-tab:grid max-tab:grid-cols-3 max-tab:gap-2", hasOpen && "max-tab:hidden"),
					"aria-label": "Desktop",
					children: APPS.filter((a) => a.desktop).map((app) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => openApp(app.id),
						className: "flex w-20 flex-col items-center gap-1 rounded-sm px-1 py-2 text-ink hover:bg-ink/10 max-tab:w-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-11 items-center justify-center rounded-sm bg-mica/80 shadow-[0_0_0_1px_rgb(255_255_255/0.08)] backdrop-blur-md",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(app.icon, {
								className: "size-5",
								strokeWidth: 1.6
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "line-clamp-2 text-center text-xs font-medium leading-tight drop-shadow-[0_1px_2px_rgb(0_0_0/0.8)]",
							children: app.title
						})]
					}, app.id))
				}), windows.map((win) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WindowFrame, { win }, win.id))]
			}),
			startOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Dismiss Start",
				className: "absolute inset-0 z-30 cursor-default",
				onClick: () => setStart(false)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartMenu, {})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Taskbar, { now }),
			asleep ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "absolute inset-0 z-50 flex flex-col items-center justify-end bg-dusk/55 pb-24 text-center backdrop-blur-[2px]",
				onClick: () => setAsleep(false),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-6xl tabular tracking-tight drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)]",
					children: now.toLocaleTimeString(void 0, {
						hour: "numeric",
						minute: "2-digit"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 text-sm text-ink/80",
					children: "Click to wake Helix"
				})]
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desktop, {});
}
//#endregion
export { Home as component };
