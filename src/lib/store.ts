import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppId, BenchMetrics, HostSnapshot, QualityScores, Settings, WinState } from "./types";
import { DEFAULT_MODEL } from "./models";

const DEFAULTS: Record<AppId, Omit<WinState, "z" | "minimized" | "maximized">> = {
  telemetry: { id: "telemetry", x: 124, y: 28, w: 900, h: 600 },
  bench: { id: "bench", x: 150, y: 48, w: 700, h: 540 },
  eval: { id: "eval", x: 168, y: 40, w: 740, h: 560 },
  hardware: { id: "hardware", x: 140, y: 44, w: 780, h: 540 },
  cost: { id: "cost", x: 160, y: 56, w: 680, h: 520 },
  settings: { id: "settings", x: 200, y: 64, w: 480, h: 500 },
  recycle: { id: "recycle", x: 220, y: 80, w: 400, h: 300 },
};

export const APP_TITLE: Record<AppId, string> = {
  telemetry: "Telemetry",
  bench: "Bench Lab",
  eval: "Eval Suite",
  hardware: "Hardware",
  cost: "Cost Ledger",
  settings: "Settings",
  recycle: "Recycle Bin",
};

type DesktopState = {
  windows: WinState[];
  focused: AppId | null;
  startOpen: boolean;
  flyout: "none" | "clock" | "tray";
  asleep: boolean;
  search: string;
  zTop: number;
  settings: Settings;
  history: BenchMetrics[];
  quality: QualityScores | null;
  liveText: string;
  liveRunning: boolean;
  liveError: string | null;
  host: HostSnapshot | null;
  notice: string | null;
  openApp: (id: AppId) => void;
  closeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  toggleMin: (id: AppId) => void;
  toggleMax: (id: AppId) => void;
  moveApp: (id: AppId, x: number, y: number) => void;
  resizeApp: (id: AppId, w: number, h: number) => void;
  setStart: (open: boolean) => void;
  setFlyout: (f: DesktopState["flyout"]) => void;
  setAsleep: (v: boolean) => void;
  setSearch: (v: string) => void;
  patchSettings: (p: Partial<Settings>) => void;
  pushRun: (m: BenchMetrics) => void;
  setQuality: (q: QualityScores) => void;
  setLive: (p: { text?: string; running?: boolean; error?: string | null }) => void;
  setHost: (h: HostSnapshot) => void;
  setNotice: (n: string | null) => void;
  clearHistory: () => void;
};

function bump(win: WinState, z: number): WinState {
  return { ...win, z, minimized: false };
}

export const useDesk = create<DesktopState>()(
  persist(
    (set, get) => ({
      windows: [{ ...DEFAULTS.telemetry, z: 20, minimized: false, maximized: false }],
      focused: "telemetry",
      startOpen: false,
      flyout: "none",
      asleep: false,
      search: "",
      zTop: 20,
      settings: {
        model: DEFAULT_MODEL,
        gpu: "h100",
        kwhUsd: 0.14,
        carbonGPerKwh: 385,
      },
      history: [],
      quality: null,
      liveText: "",
      liveRunning: false,
      liveError: null,
      host: null,
      notice: null,
      openApp: (id) => {
        const { windows, zTop } = get();
        const existing = windows.find((w) => w.id === id);
        const z = zTop + 1;
        if (existing) {
          set({
            windows: windows.map((w) => (w.id === id ? bump(w, z) : w)),
            focused: id,
            zTop: z,
            startOpen: false,
          });
          return;
        }
        set({
          windows: [...windows, { ...DEFAULTS[id], z, minimized: false, maximized: false }],
          focused: id,
          zTop: z,
          startOpen: false,
        });
      },
      closeApp: (id) => {
        const windows = get().windows.filter((w) => w.id !== id);
        set({
          windows,
          focused: windows.at(-1)?.id ?? null,
        });
      },
      focusApp: (id) => {
        const z = get().zTop + 1;
        set({
          windows: get().windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
          focused: id,
          zTop: z,
          startOpen: false,
          flyout: "none",
        });
      },
      toggleMin: (id) => {
        const win = get().windows.find((w) => w.id === id);
        if (!win) return;
        if (win.minimized) {
          get().focusApp(id);
          return;
        }
        const rest = get().windows.filter((w) => w.id !== id && !w.minimized);
        set({
          windows: get().windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
          focused: rest.sort((a, b) => b.z - a.z)[0]?.id ?? null,
        });
      },
      toggleMax: (id) => {
        set({
          windows: get().windows.map((w) =>
            w.id === id ? { ...w, maximized: !w.maximized, minimized: false } : w,
          ),
          focused: id,
        });
      },
      moveApp: (id, x, y) => {
        set({
          windows: get().windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        });
      },
      resizeApp: (id, w, h) => {
        set({
          windows: get().windows.map((win) =>
            win.id === id ? { ...win, w: Math.max(360, w), h: Math.max(240, h) } : win,
          ),
        });
      },
      setStart: (open) => set({ startOpen: open, flyout: open ? "none" : get().flyout }),
      setFlyout: (f) => set({ flyout: f, startOpen: false }),
      setAsleep: (v) => set({ asleep: v, startOpen: false, flyout: "none" }),
      setSearch: (v) => set({ search: v }),
      patchSettings: (p) => set({ settings: { ...get().settings, ...p } }),
      pushRun: (m) =>
        set({
          history: [m, ...get().history].slice(0, 40),
          notice: `Probe complete · ${m.outputTps.toFixed(1)} t/s · TTFT ${Math.round(m.ttftMs)} ms`,
        }),
      setQuality: (q) => set({ quality: q }),
      setLive: (p) =>
        set({
          liveText: p.text ?? get().liveText,
          liveRunning: p.running ?? get().liveRunning,
          liveError: p.error === undefined ? get().liveError : p.error,
        }),
      setHost: (h) => set({ host: h }),
      setNotice: (n) => set({ notice: n }),
      clearHistory: () => set({ history: [], quality: null, notice: "History cleared" }),
    }),
    {
      name: "helix-desk-v1",
      skipHydration: true,
      partialize: (s) => ({
        settings: s.settings,
        history: s.history,
        quality: s.quality,
      }),
    },
  ),
);
