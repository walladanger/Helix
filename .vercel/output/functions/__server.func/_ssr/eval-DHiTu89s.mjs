import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { o as isModelId } from "./models-1pMUrgZU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/eval-DHiTu89s.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var MMLU_ITEMS = [
	{
		id: "m1",
		subject: "Geography",
		question: "What is the capital of Australia?",
		choices: [
			"Sydney",
			"Canberra",
			"Melbourne",
			"Perth"
		],
		answer: "B"
	},
	{
		id: "m2",
		subject: "Physics",
		question: "Newton's second law states that force equals:",
		choices: [
			"mass × velocity",
			"mass × acceleration",
			"mass / acceleration",
			"energy × time"
		],
		answer: "B"
	},
	{
		id: "m3",
		subject: "Biology",
		question: "In DNA, adenine pairs with:",
		choices: [
			"Guanine",
			"Cytosine",
			"Thymine",
			"Uracil"
		],
		answer: "C"
	},
	{
		id: "m4",
		subject: "Literature",
		question: "Who wrote Pride and Prejudice?",
		choices: [
			"Charlotte Brontë",
			"Jane Austen",
			"Mary Shelley",
			"George Eliot"
		],
		answer: "B"
	},
	{
		id: "m5",
		subject: "Math",
		question: "The derivative of sin(x) with respect to x is:",
		choices: [
			"−sin(x)",
			"tan(x)",
			"−cos(x)",
			"cos(x)"
		],
		answer: "D"
	},
	{
		id: "m6",
		subject: "CS",
		question: "HTTP status 404 means:",
		choices: [
			"Unauthorized",
			"Not Found",
			"Server Error",
			"Redirect"
		],
		answer: "B"
	}
];
var GSM_ITEMS = [
	{
		id: "g1",
		question: "A shop has 15 apples, sells 6, then buys 8. How many apples are there now?",
		answer: 17
	},
	{
		id: "g2",
		question: "A train travels 60 miles per hour for 2.5 hours. How many miles does it travel?",
		answer: 150
	},
	{
		id: "g3",
		question: "What is 3/4 of 80?",
		answer: 60
	},
	{
		id: "g4",
		question: "A book costs $12. After a 25% discount, what is the price in dollars?",
		answer: 9
	},
	{
		id: "g5",
		question: "The mean of 4, 8, 10, and 18 is?",
		answer: 10
	}
];
var CODE_ITEMS = [
	{
		id: "c1",
		name: "sumList",
		prompt: "Write a JavaScript function named sumList(arr) that returns the sum of numbers in arr. Empty list sums to 0.",
		tests: [
			{
				args: [[
					1,
					2,
					3
				]],
				expect: 6
			},
			{
				args: [[]],
				expect: 0
			},
			{
				args: [[-2, 5]],
				expect: 3
			}
		]
	},
	{
		id: "c2",
		name: "isPalindrome",
		prompt: "Write a JavaScript function named isPalindrome(s) that returns true if s reads the same forwards and backwards, ignoring case. Otherwise false.",
		tests: [
			{
				args: ["Racecar"],
				expect: true
			},
			{
				args: ["hello"],
				expect: false
			},
			{
				args: ["a"],
				expect: true
			}
		]
	},
	{
		id: "c3",
		name: "factorial",
		prompt: "Write a JavaScript function named factorial(n) that returns n! for integer n >= 0. factorial(0) is 1.",
		tests: [
			{
				args: [0],
				expect: 1
			},
			{
				args: [5],
				expect: 120
			},
			{
				args: [3],
				expect: 6
			}
		]
	}
];
var RAG_DOCS = [
	{
		id: "d1",
		title: "Helix Overview",
		text: "Helix is an LLM observability desktop that measures latency, hardware, quality, and cost. First released in 2026.",
		tags: [
			"helix",
			"observability",
			"desktop",
			"2026"
		]
	},
	{
		id: "d2",
		title: "Latency",
		text: "Time to first token (TTFT) is the delay from request to the first generated token. Time per output token (TPOT) is the average interval between subsequent tokens.",
		tags: [
			"ttft",
			"tpot",
			"latency",
			"token"
		]
	},
	{
		id: "d3",
		title: "Hardware",
		text: "The KV cache stores key and value tensors for each transformer layer so previous tokens are not recomputed. Cache size grows linearly with context length.",
		tags: [
			"kv",
			"cache",
			"vram",
			"context"
		]
	},
	{
		id: "d4",
		title: "Pricing",
		text: "Grok 4.5 API pricing is $2.00 per million input tokens and $6.00 per million output tokens below 200k prompt tokens. Cached input is $0.50 per million.",
		tags: [
			"price",
			"grok",
			"tokens",
			"cached"
		]
	},
	{
		id: "d5",
		title: "Birds",
		text: "The Caspian tern nests on sandy islands and feeds primarily on small fish.",
		tags: [
			"tern",
			"bird",
			"fish"
		]
	},
	{
		id: "d6",
		title: "Energy",
		text: "An H100 GPU has a 700W TDP. Energy per 1,000 tokens is estimated from TDP, utilization, and generation duration.",
		tags: [
			"h100",
			"energy",
			"watts",
			"tokens"
		]
	}
];
var RAG_QUERY = "What is TTFT, and what does Helix charge for Grok input tokens?";
var RAG_RELEVANT = /* @__PURE__ */ new Set(["d2", "d4"]);
function retrieveDocs(query, k = 4) {
	const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
	return RAG_DOCS.map((doc) => {
		const hay = `${doc.title} ${doc.text} ${doc.tags.join(" ")}`.toLowerCase();
		return {
			doc,
			score: terms.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0)
		};
	}).sort((a, b) => b.score - a.score).slice(0, k);
}
function contextPrecision(ids) {
	if (ids.length === 0) return 0;
	return ids.filter((id) => RAG_RELEVANT.has(id)).length / ids.length;
}
function faithfulness(answer, context) {
	const sentences = answer.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 12);
	if (sentences.length === 0) return 0;
	const ctx = context.toLowerCase();
	return sentences.filter((s) => {
		const words = s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
		const hits = words.filter((w) => ctx.includes(w)).length;
		return words.length > 0 && hits / words.length >= .45;
	}).length / sentences.length;
}
function answerRelevance(answer, query) {
	const q = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
	if (q.length === 0) return 0;
	const a = answer.toLowerCase();
	return q.filter((w) => a.includes(w)).length / q.length;
}
async function complete(model, prompt, maxTokens) {
	const { parseUsage, xaiChat } = await import("./xai-CodOQAkd.mjs").then((n) => n.i);
	const started = await xaiChat({
		model,
		messages: [{
			role: "system",
			content: "Follow the user format exactly. No preamble, no markdown fences unless asked for code only."
		}, {
			role: "user",
			content: prompt
		}],
		maxTokens
	});
	if (!started.ok) return started;
	const body = await started.res.json();
	return {
		ok: true,
		text: body.choices?.[0]?.message?.content ?? "",
		usage: parseUsage(body.usage, started.model),
		model: started.model
	};
}
function letterOf(text) {
	const m = text.trim().match(/^[A-D]/i);
	return m ? m[0].toUpperCase() : "";
}
function lastNumber(text) {
	const matches = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/g);
	return matches ? Number(matches[matches.length - 1]) : NaN;
}
function extractFn(text, name) {
	const cleaned = text.replace(/```(?:javascript|js)?/gi, "").replace(/```/g, "").trim();
	const start = cleaned.indexOf(`function ${name}`);
	const arrow = cleaned.indexOf(`${name} =`);
	const constn = cleaned.indexOf(`const ${name}`);
	let src = cleaned;
	const idx = [
		start,
		constn,
		arrow
	].filter((n) => n >= 0);
	if (idx.length) src = cleaned.slice(Math.min(...idx));
	if (/fetch|import|require|process|globalThis|window|eval|Function/.test(src)) return null;
	return src;
}
function runTests(src, name, tests) {
	try {
		const fn = new Function(`${src}; return ${name};`)();
		if (typeof fn !== "function") return {
			passed: 0,
			notes: [`${name} is not a function`]
		};
		let passed = 0;
		const notes = [];
		for (const t of tests) {
			const got = fn(...t.args);
			if (Object.is(got, t.expect)) passed += 1;
			else notes.push(`${name}(${JSON.stringify(t.args)}) → ${JSON.stringify(got)}, expected ${JSON.stringify(t.expect)}`);
		}
		return {
			passed,
			notes
		};
	} catch (err) {
		return {
			passed: 0,
			notes: [`${name} threw: ${err instanceof Error ? err.message : "error"}`]
		};
	}
}
function entropy(text) {
	if (text.length < 8) return null;
	const freq = /* @__PURE__ */ new Map();
	for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
	let h = 0;
	for (const c of freq.values()) {
		const p = c / text.length;
		h -= p * Math.log2(p);
	}
	return h;
}
var runEvalSuite_createServerFn_handler = createServerRpc({
	id: "a88cc7d4b39ffdfbb64eecc6eaed2f41226f281c8d1accde7a01385783b63d7a",
	name: "runEvalSuite",
	filename: "src/lib/llm/eval.ts"
}, (opts) => runEvalSuite.__executeServer(opts));
var runEvalSuite = createServerFn({ method: "POST" }).validator((input) => input).handler(runEvalSuite_createServerFn_handler, async ({ data }) => {
	const model = isModelId(data.model) ? data.model : "grok-4.5";
	if (data.suite === "mmlu") {
		const res = await complete(model, `Answer each multiple-choice question with the letter only, one per line as "1. X".\n\n${MMLU_ITEMS.map((q, i) => `${i + 1}. (${q.subject}) ${q.question}\nA. ${q.choices[0]}\nB. ${q.choices[1]}\nC. ${q.choices[2]}\nD. ${q.choices[3]}`).join("\n\n")}`, 80);
		if (!res.ok) return res;
		const lines = res.text.split("\n").map((l) => letterOf(l));
		let passed = 0;
		const notes = [];
		MMLU_ITEMS.forEach((q, i) => {
			const got = lines[i] || letterOf(res.text);
			if (got === q.answer) passed += 1;
			else notes.push(`${q.id}: got ${got || "∅"}, expected ${q.answer}`);
		});
		return {
			ok: true,
			suite: "mmlu",
			model: res.model,
			passed,
			total: MMLU_ITEMS.length,
			score: passed / MMLU_ITEMS.length,
			notes,
			costUsd: res.usage.costUsd,
			entropyBpc: entropy(res.text)
		};
	}
	if (data.suite === "gsm8k") {
		const res = await complete(model, `Solve each. Reply with one line per item as "1. <number>" — the number only after the dot.\n\n${GSM_ITEMS.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}`, 80);
		if (!res.ok) return res;
		const lines = res.text.split("\n");
		let passed = 0;
		const notes = [];
		GSM_ITEMS.forEach((q, i) => {
			const got = lastNumber(lines[i] ?? res.text);
			if (got === q.answer) passed += 1;
			else notes.push(`${q.id}: got ${Number.isFinite(got) ? got : "∅"}, expected ${q.answer}`);
		});
		return {
			ok: true,
			suite: "gsm8k",
			model: res.model,
			passed,
			total: GSM_ITEMS.length,
			score: passed / GSM_ITEMS.length,
			notes,
			costUsd: res.usage.costUsd,
			entropyBpc: entropy(res.text)
		};
	}
	if (data.suite === "humaneval") {
		let passed = 0;
		let total = 0;
		const notes = [];
		let cost = 0;
		let usedModel = model;
		let blob = "";
		for (const item of CODE_ITEMS) {
			const res = await complete(model, `${item.prompt}\nReturn only the function source. No markdown.`, 120);
			if (!res.ok) return res;
			usedModel = res.model;
			cost += res.usage.costUsd;
			blob += res.text;
			const src = extractFn(res.text, item.name);
			total += item.tests.length;
			if (!src) {
				notes.push(`${item.name}: could not parse a safe function`);
				continue;
			}
			const run = runTests(src, item.name, item.tests);
			passed += run.passed;
			notes.push(...run.notes);
		}
		return {
			ok: true,
			suite: "humaneval",
			model: usedModel,
			passed,
			total,
			score: total ? passed / total : 0,
			notes,
			costUsd: cost,
			entropyBpc: entropy(blob)
		};
	}
	const retrieved = retrieveDocs(RAG_QUERY, 4);
	const ids = retrieved.map((r) => r.doc.id);
	const res = await complete(model, `Answer using only the context. If the context is insufficient, say you don't know.\n\nContext:\n${retrieved.map((r) => `[${r.doc.id}] ${r.doc.title}: ${r.doc.text}`).join("\n")}\n\nQuestion: ${RAG_QUERY}`, 160);
	if (!res.ok) return res;
	const ctxJoin = retrieved.map((r) => r.doc.text).join(" ");
	const extra = {
		contextPrecision: contextPrecision(ids),
		faithfulness: faithfulness(res.text, ctxJoin),
		answerRelevance: answerRelevance(res.text, RAG_QUERY),
		answer: res.text
	};
	const score = (extra.contextPrecision + extra.faithfulness + extra.answerRelevance) / 3;
	return {
		ok: true,
		suite: "rag",
		model: res.model,
		passed: Math.round(score * 3),
		total: 3,
		score,
		notes: [`Retrieved ${ids.join(", ")}`],
		costUsd: res.usage.costUsd,
		entropyBpc: entropy(res.text),
		extra
	};
});
//#endregion
export { runEvalSuite_createServerFn_handler };
