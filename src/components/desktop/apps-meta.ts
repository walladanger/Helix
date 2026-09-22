import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Cpu,
  FlaskConical,
  Gauge,
  Leaf,
  Settings2,
  Trash2,
} from "lucide-react";
import type { AppId } from "@/lib/types";
import { BenchApp } from "@/components/apps/Bench";
import { CostApp } from "@/components/apps/Cost";
import { EvalApp } from "@/components/apps/EvalSuite";
import { HardwareApp } from "@/components/apps/Hardware";
import { RecycleApp, SettingsApp } from "@/components/apps/Settings";
import { TelemetryApp } from "@/components/apps/Telemetry";
import type { ComponentType } from "react";

export const APPS: {
  id: AppId;
  title: string;
  hint: string;
  icon: LucideIcon;
  View: ComponentType;
  pin?: boolean;
  desktop?: boolean;
}[] = [
  { id: "telemetry", title: "Telemetry", hint: "Speed, quality, cost", icon: Activity, View: TelemetryApp, pin: true, desktop: true },
  { id: "bench", title: "Bench Lab", hint: "Stream a live probe", icon: Gauge, View: BenchApp, pin: true, desktop: true },
  { id: "eval", title: "Eval Suite", hint: "MMLU, math, code, RAG", icon: FlaskConical, View: EvalApp, pin: true, desktop: true },
  { id: "hardware", title: "Hardware", hint: "VRAM, KV, SM, host", icon: Cpu, View: HardwareApp, pin: true, desktop: true },
  { id: "cost", title: "Cost Ledger", hint: "Dollars, watts, carbon", icon: Leaf, View: CostApp, pin: true, desktop: true },
  { id: "settings", title: "Settings", hint: "Model and energy", icon: Settings2, View: SettingsApp, pin: false, desktop: true },
  { id: "recycle", title: "Recycle Bin", hint: "Empty", icon: Trash2, View: RecycleApp, pin: false, desktop: true },
];

export function appMeta(id: AppId) {
  return APPS.find((a) => a.id === id) ?? APPS[0];
}
