import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { runBench } from "@/lib/llm/client-bench";
import { gpuMeta } from "@/lib/models";
import { kvCacheBytes, peakVramBytes, smEfficiency } from "@/lib/hardware";
import { useDesk } from "@/lib/store";
import { fmtBytes, fmtMs, fmtPct, fmtTps, fmtUsd } from "@/lib/utils";
import { Note, Section, Tile } from "./shared";

const PROBE =
  "In two short sentences, define time-to-first-token and time-per-output-token for large language models.";

const TIP = {
  background: "var(--color-mica)",
  border: "1px solid rgb(255 255 255 / 0.1)",
  borderRadius: 8,
  fontSize: 12,
};

export function TelemetryApp() {
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
    tpot: r.tpotMs,
  }));

  return (
    <div className="space-y-5 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">LLM telemetry</h2>
          <p className="mt-0.5 text-sm text-muted">
            Live speed, memory, quality, and cost for {settings.model}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={liveRunning} onClick={() => void probe()}>
            {liveRunning ? "Probing…" : "Quick probe"}
          </Button>
          <Button variant="ghost" onClick={() => openApp("bench")}>
            Bench Lab
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Tile
          label="TTFT"
          value={fmtMs(last?.ttftMs)}
          hint="Request → first token"
          tone={last && last.ttftMs < 800 ? "ok" : last ? "warn" : "ink"}
        />
        <Tile label="Output" value={fmtTps(last?.outputTps)} hint="Generation throughput" />
        <Tile label="TPOT" value={fmtMs(last?.tpotMs)} hint="Avg. inter-token time" />
        <Tile label="Prompt" value={fmtTps(last?.promptTps)} hint="Tokens / TTFT (incl. queue)" />
      </div>

      <Section title="Latency across runs">
        <div className="h-40 rounded-md bg-ink/5 p-2">
          {chart.length < 2 ? (
            <EmptyChart text="Run two probes to plot TTFT and throughput." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgb(243 244 246 / 0.06)" vertical={false} />
                <XAxis dataKey="i" hide />
                <YAxis hide />
                <Tooltip contentStyle={TIP} labelFormatter={(v) => `Run ${String(v)}`} />
                <Area
                  type="monotone"
                  dataKey="ttft"
                  stroke="var(--color-accent)"
                  fill="var(--color-accent)"
                  fillOpacity={0.12}
                  name="TTFT ms"
                />
                <Area
                  type="monotone"
                  dataKey="tps"
                  stroke="var(--color-ok)"
                  fill="var(--color-ok)"
                  fillOpacity={0.08}
                  name="t/s"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Section>

      <div className="grid gap-3 md:grid-cols-2">
        <Section title="Memory & hardware">
          <div className="grid grid-cols-2 gap-2">
            <Tile label="KV cache" value={fmtBytes(kv)} hint={`${seq.toLocaleString()} tokens`} />
            <Tile label="Peak VRAM" value={fmtBytes(peak)} hint={`${gpu.name} · estimate`} />
            <Tile label="SM / GPU" value={fmtPct(sm?.smPct)} hint={gpu.name} />
            <Tile
              label="Cache hit"
              value={fmtPct(last?.cacheHitPct)}
              hint={last ? `${last.cachedTokens} cached` : "Prompt cache"}
            />
          </div>
          <Note>
            VRAM and SM figures are serving estimates (weights + KV + activations). CUDA counters
            are not exposed by the API.
          </Note>
        </Section>
        <Section title="Quality & cost">
          <div className="grid grid-cols-2 gap-2">
            <Tile
              label="MMLU"
              value={quality?.mmlu != null ? fmtPct(quality.mmlu * 100) : "—"}
              hint="General knowledge"
            />
            <Tile
              label="GSM8K"
              value={quality?.gsm8k != null ? fmtPct(quality.gsm8k * 100) : "—"}
              hint="Grade-school math"
            />
            <Tile
              label="HumanEval"
              value={quality?.humanEval != null ? fmtPct(quality.humanEval * 100) : "—"}
              hint="Coding tests"
            />
            <Tile
              label="Last cost"
              value={fmtUsd(last?.costUsd)}
              hint={last ? `${last.promptTokens}+${last.completionTokens} tok` : "Per request"}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="ghost" className="h-10" onClick={() => openApp("eval")}>
              Run evals
            </Button>
            <Button variant="quiet" className="h-10" onClick={() => openApp("hardware")}>
              Hardware
            </Button>
            <Button variant="quiet" className="h-10" onClick={() => openApp("cost")}>
              Cost ledger
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-faint">
      {text}
    </div>
  );
}

async function probe() {
  const { settings, setLive, pushRun, openApp } = useDesk.getState();
  if (useDesk.getState().liveRunning) return;
  openApp("bench");
  setLive({ running: true, text: "", error: null });
  try {
    const metrics = await runBench({
      prompt: PROBE,
      model: settings.model,
      maxTokens: 80,
      live: {
        onToken: (piece) => {
          setLive({ text: useDesk.getState().liveText + piece });
        },
      },
    });
    setLive({ running: false, text: metrics.outputText });
    pushRun(metrics);
  } catch (err) {
    setLive({
      running: false,
      error: err instanceof Error ? err.message : "Probe failed",
    });
  }
}
