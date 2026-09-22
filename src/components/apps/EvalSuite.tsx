import { useState } from "react";
import { Button } from "@/components/ui/button";
import { runEvalSuite, type EvalResult } from "@/lib/llm/eval";
import { useDesk } from "@/lib/store";
import { fmtPct, fmtUsd } from "@/lib/utils";
import type { QualityScores } from "@/lib/types";
import { Note, Section, Tile } from "./shared";

const SUITES: { id: "mmlu" | "gsm8k" | "humaneval" | "rag"; title: string; blurb: string }[] = [
  { id: "mmlu", title: "MMLU slice", blurb: "Six multiple-choice items across science, CS, and humanities." },
  { id: "gsm8k", title: "GSM8K slice", blurb: "Five grade-school word problems, numeric answers." },
  { id: "humaneval", title: "HumanEval slice", blurb: "Three tiny JavaScript functions, executed against tests." },
  { id: "rag", title: "RAG trio", blurb: "Context precision, faithfulness, and answer relevance on a fixed corpus." },
];

export function EvalApp() {
  const quality = useDesk((s) => s.quality);
  const settings = useDesk((s) => s.settings);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function run(suite: (typeof SUITES)[number]["id"]) {
    if (busy) return;
    setBusy(suite);
    setError(null);
    try {
      const result = await runEvalSuite({ data: { suite, model: settings.model } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      applyQuality(result);
      setLog((l) => [
        `${result.suite}: ${result.passed}/${result.total} · ${fmtPct(result.score * 100)} · ${fmtUsd(result.costUsd)}`,
        ...result.notes.slice(0, 6),
        ...l,
      ].slice(0, 24));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eval failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Eval Suite</h2>
        <p className="mt-0.5 text-sm text-muted">
          Compact, user-started slices — not the full public leaderboards. Each click is one API round.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Tile label="MMLU" value={quality?.mmlu != null ? fmtPct(quality.mmlu * 100) : "—"} />
        <Tile label="GSM8K" value={quality?.gsm8k != null ? fmtPct(quality.gsm8k * 100) : "—"} />
        <Tile
          label="HumanEval"
          value={quality?.humanEval != null ? fmtPct(quality.humanEval * 100) : "—"}
        />
        <Tile
          label="Entropy"
          value={quality?.perplexityProxy != null ? quality.perplexityProxy.toFixed(2) : "—"}
          hint="bits/char (PPL proxy)"
        />
      </div>

      {quality?.rag ? (
        <div className="grid grid-cols-3 gap-2">
          <Tile label="Ctx precision" value={fmtPct(quality.rag.contextPrecision * 100)} />
          <Tile label="Faithfulness" value={fmtPct(quality.rag.faithfulness * 100)} />
          <Tile label="Relevance" value={fmtPct(quality.rag.answerRelevance * 100)} />
        </div>
      ) : null}

      <Section title="Run a slice">
        <div className="grid gap-2">
          {SUITES.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-md bg-ink/5 px-3 py-3"
            >
              <div>
                <div className="text-sm font-medium">{s.title}</div>
                <div className="text-xs text-faint">{s.blurb}</div>
              </div>
              <Button
                variant="ghost"
                className="h-10 shrink-0"
                disabled={Boolean(busy)}
                onClick={() => void run(s.id)}
              >
                {busy === s.id ? "Running…" : "Run"}
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {error ? <p className="text-sm text-bad">{error}</p> : null}

      <Section title="Notes">
        {log.length === 0 ? (
          <Note>
            True perplexity needs token log-probs, which this API does not return. Bits-per-character
            of the model’s own output is shown as a stand-in, next to task accuracy.
          </Note>
        ) : (
          <ul className="win-scroll max-h-36 space-y-1 overflow-auto font-mono text-xs text-muted">
            {log.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function applyQuality(result: Extract<EvalResult, { ok: true }>) {
  const prev = useDesk.getState().quality;
  const next: QualityScores = {
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
      notes: result.notes,
    },
  };
  if (result.suite === "mmlu") next.mmlu = result.score;
  if (result.suite === "gsm8k") next.gsm8k = result.score;
  if (result.suite === "humaneval") next.humanEval = result.score;
  if (result.suite === "rag" && result.extra) {
    next.rag = {
      contextPrecision: result.extra.contextPrecision,
      faithfulness: result.extra.faithfulness,
      answerRelevance: result.extra.answerRelevance,
    };
  }
  useDesk.getState().setQuality(next);
}
