import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tile({
  label,
  value,
  hint,
  tone = "ink",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "ok" | "warn" | "bad";
}) {
  return (
    <div className="rounded-md bg-ink/5 px-3 py-3 shadow-[var(--shadow-border,0_0_0_1px_rgb(255_255_255/0.06))]">
      <div className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</div>
      <div
        className={cn(
          "mt-1 font-mono text-xl tabular leading-tight tracking-tight",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "bad" && "text-bad",
          tone === "ink" && "text-ink",
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-faint">{hint}</div> : null}
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Bar({
  label,
  value,
  display,
  max = 100,
}: {
  label: string;
  value: number;
  display: string;
  max?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono tabular text-ink">{display}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-faint">{children}</p>;
}
