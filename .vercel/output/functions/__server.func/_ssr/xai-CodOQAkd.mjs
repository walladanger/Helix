import { o as isModelId, s as modelMeta } from "./models-1pMUrgZU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/xai-CodOQAkd.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var xai_exports = /* @__PURE__ */ __exportAll({
	iterateSse: () => iterateSse,
	parseUsage: () => parseUsage,
	xaiChat: () => xaiChat
});
function parseUsage(raw, model) {
	const promptTokens = raw?.prompt_tokens ?? raw?.input_tokens ?? 0;
	const completionTokens = raw?.completion_tokens ?? raw?.output_tokens ?? 0;
	const cachedTokens = raw?.prompt_tokens_details?.cached_tokens ?? raw?.prompt_cache_hit_tokens ?? 0;
	let costUsd = 0;
	if (typeof raw?.cost_in_usd_ticks === "number") costUsd = raw.cost_in_usd_ticks / 1e10;
	else {
		const meta = modelMeta(model);
		costUsd = Math.max(0, promptTokens - cachedTokens) / 1e6 * meta.inputPerM + cachedTokens / 1e6 * meta.cachedPerM + completionTokens / 1e6 * meta.outputPerM;
	}
	return {
		promptTokens,
		completionTokens,
		cachedTokens,
		costUsd
	};
}
async function xaiChat(opts) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available in this environment"
	};
	const model = isModelId(opts.model) ? opts.model : "grok-4.5";
	const body = {
		model,
		messages: opts.messages,
		max_tokens: opts.maxTokens,
		stream: Boolean(opts.stream),
		...opts.stream ? { stream_options: { include_usage: true } } : {}
	};
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${apiKey}`
	};
	let res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers,
		body: JSON.stringify(body)
	});
	if (res.status === 404 && model === "grok-4.5") res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers,
		body: JSON.stringify({
			...body,
			model: "grok-4.7"
		})
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		return {
			ok: false,
			error: `xAI API error ${res.status}${text ? `: ${text.slice(0, 180)}` : ""}`
		};
	}
	return {
		ok: true,
		res,
		model
	};
}
async function* iterateSse(res) {
	const reader = res.body?.getReader();
	if (!reader) return;
	const dec = new TextDecoder();
	let buf = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buf += dec.decode(value, { stream: true });
		const lines = buf.split("\n");
		buf = lines.pop() ?? "";
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed.startsWith("data:")) continue;
			const payload = trimmed.slice(5).trim();
			if (!payload || payload === "[DONE]") continue;
			try {
				yield JSON.parse(payload);
			} catch {}
		}
	}
}
//#endregion
export { __exportAll as a, xai_exports as i, parseUsage as n, xaiChat as r, iterateSse as t };
