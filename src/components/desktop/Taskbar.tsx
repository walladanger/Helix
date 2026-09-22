import { Search } from "lucide-react";
import { APPS, appMeta } from "./apps-meta";
import { HelixMark } from "./HelixMark";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Taskbar({ now }: { now: Date }) {
  const windows = useDesk((s) => s.windows);
  const focused = useDesk((s) => s.focused);
  const startOpen = useDesk((s) => s.startOpen);
  const flyout = useDesk((s) => s.flyout);
  const openApp = useDesk((s) => s.openApp);
  const toggleMin = useDesk((s) => s.toggleMin);
  const setStart = useDesk((s) => s.setStart);
  const setFlyout = useDesk((s) => s.setFlyout);
  const notice = useDesk((s) => s.notice);
  const last = useDesk((s) => s.history[0]);

  const running = new Set(windows.map((w) => w.id));
  const pins = APPS.filter((a) => a.pin);
  const extras = windows.filter((w) => !pins.some((p) => p.id === w.id));

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto relative flex h-14 w-full max-w-[920px] items-center gap-1 rounded-md bg-taskbar px-1.5 shadow-[var(--shadow-window)] backdrop-blur-xl md:h-12 md:w-auto md:min-w-[540px]">
        <button
          type="button"
          aria-label="Start"
          onClick={() => setStart(!startOpen)}
          className={cn(
            "flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-150 md:size-10",
            startOpen ? "bg-ink/12" : "hover:bg-ink/10",
          )}
        >
          <HelixMark className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Search"
          onClick={() => setStart(true)}
          className="hidden size-10 items-center justify-center rounded-sm text-muted hover:bg-ink/10 hover:text-ink sm:flex"
        >
          <Search className="size-4" strokeWidth={1.75} />
        </button>
        <div className="mx-1 h-5 w-px bg-hairline" />
        {pins.map((app) => {
          const open = running.has(app.id);
          const isFocused = focused === app.id && open;
          const minimized = windows.find((w) => w.id === app.id)?.minimized;
          return (
            <button
              key={app.id}
              type="button"
              title={app.title}
              onClick={() => {
                if (!open) openApp(app.id);
                else if (isFocused && !minimized) toggleMin(app.id);
                else openApp(app.id);
              }}
              className={cn(
                "relative flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-150 md:size-10",
                isFocused ? "bg-ink/14" : "hover:bg-ink/10",
              )}
            >
              <app.icon className="size-4" strokeWidth={1.75} />
              {open ? (
                <span
                  className={cn(
                    "absolute bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full",
                    isFocused ? "bg-accent" : "bg-muted",
                  )}
                />
              ) : null}
            </button>
          );
        })}
        {extras.map((w) => {
          const meta = appMeta(w.id);
          return (
            <button
              key={w.id}
              type="button"
              title={meta.title}
              onClick={() => openApp(w.id)}
              className={cn(
                "relative flex size-11 items-center justify-center rounded-sm hover:bg-ink/10 md:size-10",
                focused === w.id ? "bg-ink/14" : "",
              )}
            >
              <meta.icon className="size-4" strokeWidth={1.75} />
              <span className="absolute bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-accent" />
            </button>
          );
        })}
        <div className="ml-auto flex items-center pl-2">
          <button
            type="button"
            onClick={() => setFlyout(flyout === "tray" ? "none" : "tray")}
            className={cn(
              "hidden h-10 rounded-sm px-2 text-left sm:block",
              flyout === "tray" ? "bg-ink/12" : "hover:bg-ink/10",
            )}
          >
            <div className="font-mono text-xs tabular leading-tight text-ink">
              {last ? `${last.outputTps.toFixed(0)} t/s` : "idle"}
            </div>
            <div className="text-xs text-faint">{notice ? "notice" : "GPU est."}</div>
          </button>
          <button
            type="button"
            onClick={() => setFlyout(flyout === "clock" ? "none" : "clock")}
            className={cn(
              "h-11 min-w-[4.5rem] rounded-sm px-2 text-right md:h-10",
              flyout === "clock" ? "bg-ink/12" : "hover:bg-ink/10",
            )}
          >
            <div className="font-mono text-xs tabular leading-tight">
              {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </div>
            <div className="text-xs text-faint">
              {now.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </div>
          </button>
        </div>
        {flyout === "clock" ? <ClockFlyout now={now} /> : null}
        {flyout === "tray" ? <TrayFlyout /> : null}
      </div>
    </div>
  );
}

function ClockFlyout({ now }: { now: Date }) {
  return (
    <div className="absolute right-2 bottom-[calc(100%+8px)] w-64 rounded-md bg-mica p-4 shadow-[var(--shadow-window)]">
      <div className="font-mono text-3xl tabular tracking-tight">
        {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="mt-1 text-sm text-muted">
        {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}

function TrayFlyout() {
  const last = useDesk((s) => s.history[0]);
  const notice = useDesk((s) => s.notice);
  const setNotice = useDesk((s) => s.setNotice);
  return (
    <div className="absolute right-16 bottom-[calc(100%+8px)] w-72 rounded-md bg-mica p-4 shadow-[var(--shadow-window)]">
      <p className="text-sm font-medium">System</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {notice ?? "No alerts. Run a probe to fill telemetry."}
      </p>
      {last ? (
        <p className="mt-2 font-mono text-xs text-faint">
          {last.model} · TTFT {Math.round(last.ttftMs)} ms · {last.outputTps.toFixed(1)} t/s
        </p>
      ) : null}
      {notice ? (
        <button
          type="button"
          className="mt-3 text-xs text-accent hover:text-ink"
          onClick={() => setNotice(null)}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
