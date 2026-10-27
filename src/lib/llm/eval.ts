import { createServerFn } from "@tanstack/react-start";
import {
  answerRelevance,
  CODE_ITEMS,
  contextPrecision,
  faithfulness,
  GSM_ITEMS,
  MMLU_ITEMS,
  RAG_QUERY,
  retrieveDocs,
} from "../evals";
import { isModelId, type ModelId } from "../models";
import { entropy, extractFn, lastNumber, letterOf, runTests } from "./eval-scoring.ts";

export type EvalResult =
  | { ok: false; error: string }
  | {
      ok: true;
      suite: "mmlu" | "gsm8k" | "humaneval" | "rag";
      model: ModelId;
      passed: number;
      total: number;
      score: number;
      notes: string[];
      costUsd: number;
      entropyBpc: number | null;
      extra?: {
        contextPrecision: number;
        faithfulness: number;
        answerRelevance: number;
        answer: string;
      };
    };

async function complete(model: string, prompt: string, maxTokens: number) {
  const { parseUsage, xaiChat } = await import("./xai");
  const started = await xaiChat({
    model,
    messages: [
      {
        role: "system",
        content:
          "Follow the user format exactly. No preamble, no markdown fences unless asked for code only.",
      },
      { role: "user", content: prompt },
    ],
    maxTokens,
  });
  if (!started.ok) return started;
  const body = (await started.res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: Parameters<typeof parseUsage>[0];
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  const usage = parseUsage(body.usage, started.model);
  return { ok: true as const, text, usage, model: started.model };
}

export const runEvalSuite = createServerFn({ method: "POST" })
  .validator((input: { suite: "mmlu" | "gsm8k" | "humaneval" | "rag"; model: string }) => input)
  .handler(async ({ data }): Promise<EvalResult> => {
    const model = isModelId(data.model) ? data.model : "grok-4.5";
    if (data.suite === "mmlu") {
      const prompt = MMLU_ITEMS.map(
        (q, i) =>
          `${i + 1}. (${q.subject}) ${q.question}\nA. ${q.choices[0]}\nB. ${q.choices[1]}\nC. ${q.choices[2]}\nD. ${q.choices[3]}`,
      ).join("\n\n");
      const res = await complete(
        model,
        `Answer each multiple-choice question with the letter only, one per line as "1. X".\n\n${prompt}`,
        80,
      );
      if (!res.ok) return res;
      const lines = res.text.split("\n").map((l) => letterOf(l));
      let passed = 0;
      const notes: string[] = [];
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
        entropyBpc: entropy(res.text),
      };
    }
    if (data.suite === "gsm8k") {
      const prompt = GSM_ITEMS.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
      const res = await complete(
        model,
        `Solve each. Reply with one line per item as "1. <number>" — the number only after the dot.\n\n${prompt}`,
        80,
      );
      if (!res.ok) return res;
      const lines = res.text.split("\n");
      let passed = 0;
      const notes: string[] = [];
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
        entropyBpc: entropy(res.text),
      };
    }
    if (data.suite === "humaneval") {
      let passed = 0;
      let total = 0;
      const notes: string[] = [];
      let cost = 0;
      let usedModel: ModelId = model;
      let blob = "";
      for (const item of CODE_ITEMS) {
        const res = await complete(
          model,
          `${item.prompt}\nReturn only the function source. No markdown.`,
          120,
        );
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
        entropyBpc: entropy(blob),
      };
    }
    const retrieved = retrieveDocs(RAG_QUERY, 4);
    const ids = retrieved.map((r) => r.doc.id);
    const context = retrieved
      .map((r) => `[${r.doc.id}] ${r.doc.title}: ${r.doc.text}`)
      .join("\n");
    const res = await complete(
      model,
      `Answer using only the context. If the context is insufficient, say you don't know.\n\nContext:\n${context}\n\nQuestion: ${RAG_QUERY}`,
      160,
    );
    if (!res.ok) return res;
    const ctxJoin = retrieved.map((r) => r.doc.text).join(" ");
    const extra = {
      contextPrecision: contextPrecision(ids),
      faithfulness: faithfulness(res.text, ctxJoin),
      answerRelevance: answerRelevance(res.text, RAG_QUERY),
      answer: res.text,
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
      extra,
    };
  });
