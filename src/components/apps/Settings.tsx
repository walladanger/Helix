import { Button } from "@/components/ui/button";
import { GPU_PROFILES, MODELS, type GpuId, type ModelId } from "@/lib/models";
import { useDesk } from "@/lib/store";
import { Note, Section } from "./shared";

export function SettingsApp() {
  const settings = useDesk((s) => s.settings);
  const patch = useDesk((s) => s.patchSettings);
  const clearHistory = useDesk((s) => s.clearHistory);
  const history = useDesk((s) => s.history);

  return (
    <div className="space-y-5 p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        <p className="mt-0.5 text-sm text-muted">Model, serving GPU, and energy assumptions.</p>
      </div>

      <Section title="Model">
        <select
          value={settings.model}
          onChange={(e) => patch({ model: e.target.value as ModelId })}
          className="h-11 w-full rounded-sm bg-dusk px-3 text-sm text-ink outline-none ring-1 ring-ink/10"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · ${m.inputPerM}/${m.outputPerM} per 1M
            </option>
          ))}
        </select>
      </Section>

      <Section title="Serving GPU (estimates)">
        <select
          value={settings.gpu}
          onChange={(e) => patch({ gpu: e.target.value as GpuId })}
          className="h-11 w-full rounded-sm bg-dusk px-3 text-sm text-ink outline-none ring-1 ring-ink/10"
        >
          {GPU_PROFILES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} · {g.tdpW} W · {g.vramGB} GB
            </option>
          ))}
        </select>
        <Note>
          Used for KV / VRAM / watt math. The hosted API does not expose cluster GPUs.
        </Note>
      </Section>

      <Section title="Energy">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Electricity ($/kWh)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={settings.kwhUsd}
            onChange={(e) => patch({ kwhUsd: Number(e.target.value) })}
            className="h-11 w-full rounded-sm bg-dusk px-3 font-mono text-ink outline-none ring-1 ring-ink/10"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Grid carbon (g CO₂ / kWh)</span>
          <input
            type="number"
            step="1"
            min={0}
            value={settings.carbonGPerKwh}
            onChange={(e) => patch({ carbonGPerKwh: Number(e.target.value) })}
            className="h-11 w-full rounded-sm bg-dusk px-3 font-mono text-ink outline-none ring-1 ring-ink/10"
          />
        </label>
      </Section>

      <Section title="Session">
        <p className="text-sm text-muted">{history.length} stored benches on this device.</p>
        <Button variant="ghost" onClick={clearHistory}>
          Clear history
        </Button>
      </Section>
    </div>
  );
}

export function RecycleApp() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-sm font-medium">Recycle Bin is empty</p>
      <p className="max-w-xs text-xs text-faint">
        Closed windows are not discarded. Reopen them from the desktop or Start.
      </p>
    </div>
  );
}
