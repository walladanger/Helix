import { useState } from "react";
import { Button } from "@/components/ui/button";
import { runBench } from "@/lib/llm/client-bench";
import { useDesk } from "@/lib/store";
import { fmtMs, fmtNum, fmtPct, fmtTps, fmtUsd } from "@/lib/utils";
import { Note, Section, Tile } from "./shared";

const PRESETS = [
  {
    name: "Latency",
    prompt:
      "In two short sentences, define time-to-first-token and time-per-output-token for large language models.",
    max: 80,
  },
  {
    name: "Throughput",
    prompt:
      "List twelve concise techniques that improve LLM decode throughput. One line each, no preamble.",
    max: 160,
  },
  {
    name: "Cache",
    prompt:
      "Explain how a transformer KV cache grows with context length, why fragmentation appears in paged attention, and how prefix caching raises hit rate. Three short paragraphs.",
    max: 180,
  },
];

export function BenchApp() {
  const settings = useDesk((s) => s.settings);
  const liveText = useDesk((s) => s.liveText);
  const liveRunning = useDesk((s) => s.liveRunning);
  const liveError = useDesk((s) => s.liveError);
  const last = useDesk((s) => s.history[0]);
  const [prompt, setPrompt] = useState(PRESETS[0].prompt);
  const [maxTokens, setMaxTokens] = useState(96);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Bench Lab</h2>
        <p className="mt-0.5 text-sm text-muted">
          Stream a prompt against {settings.model}. TTFT, TPOT, and t/s are measured on the server.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.name}
            variant="ghost"
            className="h-10"
            onClick={() => {
              setPrompt(p.prompt);
              setMaxTokens(p.max);
            }}
          >
            {p.name}
          </Button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">Prompt</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          maxLength={4000}
          className="w-full resize-none rounded-md bg-dusk px-3 py-2.5 text-sm leading-relaxed text-ink outline-none ring-1 ring-ink/10 focus:ring-accent/50"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          Max tokens
          <input
            type="number"
            min={16}
            max={256}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="h-11 w-20 rounded-sm bg-dusk px-2 font-mono text-ink outline-none ring-1 ring-ink/10"
          />
        </label>
        <Button
          disabled={liveRunning || prompt.trim().length === 0}
          onClick={() => void run(prompt, maxTokens)}
        >
          {liveRunning ? "Streaming…" : "Run bench"}
        </Button>
      </div>

      {liveError ? <p className="text-sm text-bad">{liveError}</p> : null}

      <Section title="Stream">
        <pre className="win-scroll max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-dusk px-3 py-2.5 font-mono text-xs leading-relaxed text-ink/90">
          {liveText || (liveRunning ? "Waiting for first token…" : "Output appears here.")}
        </pre>
      </Section>

      {last ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Tile label="TTFT" value={fmtMs(last.ttftMs)} />
          <Tile label="TPOT" value={fmtMs(last.tpotMs)} />
          <Tile label="Output t/s" value={fmtTps(last.outputTps)} />
          <Tile label="Prompt t/s" value={fmtTps(last.promptTps)} hint="prompt tokens / TTFT" />
          <Tile
            label="Tokens"
            value={`${fmtNum(last.promptTokens, 0)} → ${fmtNum(last.completionTokens, 0)}`}
            hint={`cache hit ${fmtPct(last.cacheHitPct)}`}
          />
          <Tile label="Cost" value={fmtUsd(last.costUsd)} />
        </div>
      ) : (
        <Note>
          Prompt processing throughput is tokens in the prompt divided by TTFT. On a hosted API that
          includes queueing, so treat it as a lower bound.
        </Note>
      )}
    </div>
  );
}

async function run(prompt: string, maxTokens: number) {
  const { settings, setLive, pushRun } = useDesk.getState();
  if (useDesk.getState().liveRunning) return;
  setLive({ running: true, text: "", error: null });
  try {
    const metrics = await runBench({
      prompt,
      model: settings.model,
      maxTokens,
      live: {
        onToken: (piece) => setLive({ text: useDesk.getState().liveText + piece }),
      },
    });
    setLive({ running: false, text: metrics.outputText });
    pushRun(metrics);
  } catch (err) {
    setLive({
      running: false,
      error: err instanceof Error ? err.message : "Bench failed",
    });
  }
}
