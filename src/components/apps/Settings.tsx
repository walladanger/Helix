import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GPU_PROFILES, MODELS, type GpuId, type ModelId } from "@/lib/models";
import { PROVIDERS, RUNTIMES, runtimeById } from "@/lib/runtimes/catalog";
import { launchBundledLlama, type LlamaBackend } from "@/lib/runtimes/desktop-launch";
import type { ProbeResult } from "@/lib/runtimes/contracts";
import { useDesk } from "@/lib/store";
import { Note, Section } from "./shared";

type RuntimeStatus = {
  local: { "llama-cpp": ProbeResult; "lm-studio": ProbeResult };
  providers: { openai: { configured: boolean }; anthropic: { configured: boolean } };
};

export function SettingsApp() {
  const settings = useDesk((s) => s.settings);
  const patch = useDesk((s) => s.patchSettings);
  const clearHistory = useDesk((s) => s.clearHistory);
  const history = useDesk((s) => s.history);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
  const [optionalRuntimeId, setOptionalRuntimeId] = useState("ollama");
  const [modelPath, setModelPath] = useState("");
  const [llamaBackend, setLlamaBackend] = useState<LlamaBackend>("auto");
  const [launchMessage, setLaunchMessage] = useState("");
  const [launching, setLaunching] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const check = () => fetch("/api/runtime-status", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<RuntimeStatus> : null)
      .then((status) => { if (status) setRuntimeStatus(status); })
      .catch(() => {});
    void check();
    const interval = setInterval(() => { void check(); }, 5000);
    return () => { clearInterval(interval); controller.abort(); };
  }, []);

  const optional = runtimeById(optionalRuntimeId);

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

      <Section title="Runtime connections">
        <div className="space-y-2 text-sm">
          {(["llama-cpp", "lm-studio"] as const).map((id) => {
            const runtime = runtimeById(id);
            const probe = runtimeStatus?.local[id];
            return (
              <div className="flex items-start justify-between gap-3" key={id}>
                <span>{runtime?.name}</span>
                <span className="text-right text-muted">
                  {probe?.status === "available"
                    ? `Connected · ${probe.models.length} model(s)`
                    : probe?.details ?? "Checking local server…"}
                </span>
              </div>
            );
          })}
          {PROVIDERS.map((provider) => (
            <div className="flex items-start justify-between gap-3" key={provider.id}>
              <span>{provider.label}</span>
              <span className="text-right text-muted">
                {runtimeStatus?.providers[provider.id].configured
                  ? "Key configured · no request sent"
                  : "Connector included · API key needed"}
              </span>
            </div>
          ))}
        </div>
        <Note>
          A connector is included in Helix; model weights and cloud accounts are separate.
          LM Studio is installed separately. Checking status does not run a model or incur API usage.
        </Note>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Local GGUF model path (Windows desktop)</span>
          <input type="text" value={modelPath} onChange={(event) => setModelPath(event.target.value)}
            placeholder="C:\\Models\\model.gguf" className="h-11 w-full rounded-sm bg-dusk px-3 text-sm text-ink outline-none ring-1 ring-ink/10" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">llama.cpp processing</span>
          <select value={llamaBackend} onChange={(event) => setLlamaBackend(event.target.value as LlamaBackend)}
            className="h-11 w-full rounded-sm bg-dusk px-3 text-sm text-ink outline-none ring-1 ring-ink/10">
            <option value="auto">Automatic: NVIDIA CUDA if detected, otherwise CPU</option>
            <option value="cuda">NVIDIA CUDA</option>
            <option value="cpu">CPU</option>
          </select>
        </label>
        <Button disabled={launching || !modelPath.trim()} onClick={async () => {
          setLaunching(true);
          setLaunchMessage("");
          try {
            const selected = await launchBundledLlama(modelPath, llamaBackend);
            setLaunchMessage(`llama.cpp ${selected.toUpperCase()} started. The model may take a moment to load; status updates here automatically.`);
          } catch (error) {
            setLaunchMessage(error instanceof Error ? error.message : "Could not start llama.cpp.");
          } finally { setLaunching(false); }
        }}>Launch bundled llama.cpp</Button>
        {launchMessage && <p role="status" className="text-xs text-muted">{launchMessage}</p>}
      </Section>

      <Section title="Other runtimes">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Find one of the other {RUNTIMES.length - 2} catalogued systems</span>
          <select
            value={optionalRuntimeId}
            onChange={(e) => setOptionalRuntimeId(e.target.value)}
            className="h-11 w-full rounded-sm bg-dusk px-3 text-sm text-ink outline-none ring-1 ring-ink/10"
          >
            {RUNTIMES.filter((runtime) => runtime.id !== "llama-cpp" && runtime.id !== "lm-studio").map((runtime) => (
              <option key={runtime.id} value={runtime.id}>{runtime.name}</option>
            ))}
          </select>
        </label>
        {optional && (
          <>
            <Note>{optional.purpose} {optional.requirements} Integration: catalogued; not verified.</Note>
            <a href={optional.documentation} target="_blank" rel="noopener noreferrer"
              className="inline-block rounded-sm bg-dusk px-3 py-2 text-sm text-ink ring-1 ring-ink/10">
              Open official installation information
            </a>
          </>
        )}
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
