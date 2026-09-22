import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { gpuMeta, SERVING_ARCH } from "@/lib/models";
import {
  kvBytesPerToken,
  kvCacheBytes,
  kvFragmentation,
  peakVramBytes,
  smEfficiency,
} from "@/lib/hardware";
import { useDesk } from "@/lib/store";
import { fmtBytes, fmtNum, fmtPct } from "@/lib/utils";
import { Bar, Note, Section, Tile } from "./shared";

const TICK = { fill: "var(--color-muted)", fontSize: 11 };
const TIP = {
  background: "var(--color-mica)",
  border: "1px solid rgb(255 255 255 / 0.1)",
  borderRadius: 8,
  fontSize: 12,
};

export function HardwareApp() {
  const settings = useDesk((s) => s.settings);
  const last = useDesk((s) => s.history[0]);
  const host = useDesk((s) => s.host);
  const [ctxK, setCtxK] = useState(8);
  const gpu = gpuMeta(settings.gpu);
  const seq = ctxK * 1024;
  const kv = kvCacheBytes(seq);
  const peak = peakVramBytes(seq);
  const frag = kvFragmentation(seq);
  const sm = last
    ? smEfficiency(last.outputTps, last.promptTokens + last.completionTokens, settings.gpu)
    : null;

  const series = useMemo(
    () =>
      [1, 2, 4, 8, 16, 32, 64, 128].map((k) => ({
        k,
        kvGB: kvCacheBytes(k * 1024) / 1024 ** 3,
        peakGB: peakVramBytes(k * 1024) / 1024 ** 3,
      })),
    [],
  );

  const heapPct = host?.heapUsed && host.heapLimit ? (host.heapUsed / host.heapLimit) * 100 : 0;
  const pages = Math.min(48, Math.max(8, frag.pages));
  const wastePages = Math.max(0, Math.round((frag.wastePct / 100) * 12));

  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Hardware</h2>
        <p className="mt-0.5 text-sm text-muted">
          KV, VRAM, and SM estimates for a {gpu.name} serving {SERVING_ARCH.label.toLowerCase()}.
        </p>
      </div>

      <label className="block space-y-2">
        <div className="flex justify-between text-xs text-muted">
          <span>Context length</span>
          <span className="font-mono tabular text-ink">{fmtNum(seq, 0)} tok</span>
        </div>
        <input
          type="range"
          min={1}
          max={128}
          value={ctxK}
          onChange={(e) => setCtxK(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Tile label="KV cache" value={fmtBytes(kv)} hint={`${fmtBytes(kvBytesPerToken())}/tok`} />
        <Tile
          label="Peak VRAM"
          value={fmtBytes(peak)}
          hint={`budget ${gpu.vramGB} GB`}
          tone={peak / 1024 ** 3 > gpu.vramGB ? "bad" : "ink"}
        />
        <Tile
          label="Frag waste"
          value={fmtPct(frag.wastePct)}
          hint={`${fmtBytes(frag.waste)} in 2 MB pages`}
        />
        <Tile label="Weights" value={`${SERVING_ARCH.weightGB} GB`} hint="Estimated resident experts" />
      </div>

      <Section title="KV vs context">
        <div className="h-44 rounded-md bg-ink/5 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgb(243 244 246 / 0.06)" vertical={false} />
              <XAxis dataKey="k" tick={TICK} unit="k" />
              <YAxis tick={TICK} unit=" GB" width={48} />
              <Tooltip contentStyle={TIP} />
              <ReferenceLine y={gpu.vramGB} stroke="var(--color-bad)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="kvGB" stroke="var(--color-accent)" dot={false} name="KV GB" />
              <Line type="monotone" dataKey="peakGB" stroke="var(--color-warn)" dot={false} name="Peak GB" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Paged KV map">
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: pages }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-[2px] ${i >= pages - wastePages ? "bg-warn/70" : "bg-accent/80"}`}
            />
          ))}
        </div>
        <Note>Steel cells are occupied KV pages. Amber is alignment waste from 2 MB paging.</Note>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="CUDA / SM (estimate)">
          <Bar label="SM activity" value={sm?.smPct ?? 0} display={fmtPct(sm?.smPct)} />
          <Bar label="Memory-bound" value={sm?.memBoundPct ?? 0} display={fmtPct(sm?.memBoundPct)} />
          <Note>
            {sm?.note ??
              "Run a bench to estimate SM efficiency from measured t/s and GPU bandwidth."}
          </Note>
        </Section>
        <Section title="This workstation">
          <Bar
            label="JS heap"
            value={heapPct}
            display={host?.heapUsed ? `${fmtBytes(host.heapUsed)} / ${fmtBytes(host.heapLimit)}` : "—"}
          />
          <Bar
            label="CPU cores"
            value={host?.cores ?? 0}
            max={Math.max(16, host?.cores ?? 16)}
            display={host?.cores ? String(host.cores) : "—"}
          />
          <Note>
            {host?.gpuName
              ? `Client GPU: ${host.gpuName}. Host RAM ${host.deviceMemoryGb ? `${host.deviceMemoryGb} GB` : "unknown"}.`
              : "Client GPU name is hidden unless WebGPU is available. Heap is the tokenizer / UI process, not model weights."}
          </Note>
        </Section>
      </div>
    </div>
  );
}
