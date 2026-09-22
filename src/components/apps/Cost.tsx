import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { gpuMeta, modelMeta } from "@/lib/models";
import { carbonG, energyKwh, smEfficiency } from "@/lib/hardware";
import { useDesk } from "@/lib/store";
import { fmtNum, fmtUsd } from "@/lib/utils";
import { Note, Section, Tile } from "./shared";

export function CostApp() {
  const history = useDesk((s) => s.history);
  const settings = useDesk((s) => s.settings);
  const last = history[0];
  const gpu = gpuMeta(settings.gpu);
  const model = modelMeta(settings.model);
  const spend = history.reduce((a, r) => a + r.costUsd, 0);
  const tokens = history.reduce((a, r) => a + r.promptTokens + r.completionTokens, 0);
  const sm = last
    ? smEfficiency(last.outputTps, last.promptTokens + last.completionTokens, settings.gpu)
    : null;
  const kwh = last ? energyKwh(last.totalMs, settings.gpu, sm?.smPct ?? 40) : 0;
  const gCo2 = carbonG(kwh, settings.carbonGPerKwh);
  const tokLast = last ? last.completionTokens + last.promptTokens : 0;
  const per1k = last && tokLast ? last.costUsd / (tokLast / 1000) : 0;
  const watts = gpu.tdpW * ((sm?.smPct ?? 40) / 100);
  const energyPer1kTok = last && tokLast ? (kwh / tokLast) * 1000 : 0;

  const chart = [...history].reverse().map((r, i) => ({
    i: i + 1,
    usd: r.costUsd,
    cum: 0,
  }));
  let acc = 0;
  for (const row of chart) {
    acc += row.usd;
    row.cum = acc;
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Cost Ledger</h2>
        <p className="mt-0.5 text-sm text-muted">
          API invoice plus an energy model for a {gpu.name} at {model.label} list prices.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Tile label="Last request" value={fmtUsd(last?.costUsd)} />
        <Tile label="Session" value={fmtUsd(spend)} hint={`${history.length} runs`} />
        <Tile label="$ / 1K tok" value={fmtUsd(per1k)} />
        <Tile
          label="List / 1M"
          value={`$${model.inputPerM} / $${model.outputPerM}`}
          hint={`cache $${model.cachedPerM}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Tile label="Draw" value={`${Math.round(watts)} W`} hint={`${gpu.tdpW} W TDP × util`} />
        <Tile
          label="Energy / 1K"
          value={energyPer1kTok < 0.000001 ? "—" : `${energyPer1kTok.toExponential(2)} kWh`}
        />
        <Tile label="Last kWh" value={kwh ? kwh.toExponential(2) : "—"} />
        <Tile
          label="Carbon"
          value={!gCo2 ? "—" : `${gCo2 < 0.01 ? gCo2.toExponential(2) : gCo2.toFixed(3)} g`}
          hint={`${settings.carbonGPerKwh} g/kWh grid`}
        />
      </div>

      <Section title="Spend over runs">
        <div className="h-40 rounded-md bg-ink/5 p-2">
          {chart.length < 2 ? (
            <div className="flex h-full items-center justify-center text-sm text-faint">
              Two or more benches plot cumulative spend.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <CartesianGrid stroke="rgb(243 244 246 / 0.06)" vertical={false} />
                <XAxis dataKey="i" hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-mica)",
                    border: "1px solid rgb(255 255 255 / 0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => fmtUsd(Number(v))}
                />
                <Area
                  type="monotone"
                  dataKey="cum"
                  stroke="var(--color-accent)"
                  fill="var(--color-accent)"
                  fillOpacity={0.12}
                  name="Cumulative"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Section>

      <Note>
        Financial cost uses the API invoice when present, otherwise {model.label} list rates. Energy
        assumes one {gpu.name} at estimated SM util, electricity {fmtUsd(settings.kwhUsd)}/kWh.
        Self-hosting amortization is not included. Session total: {fmtNum(tokens, 0)} tokens.
      </Note>
    </div>
  );
}
