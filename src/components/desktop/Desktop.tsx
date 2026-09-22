import { useEffect, useState } from "react";
import { APPS } from "./apps-meta";
import { StartMenu } from "./StartMenu";
import { Taskbar } from "./Taskbar";
import { WindowFrame } from "./Window";
import { sampleHost } from "@/lib/host-metrics";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Desktop() {
  const windows = useDesk((s) => s.windows);
  const startOpen = useDesk((s) => s.startOpen);
  const asleep = useDesk((s) => s.asleep);
  const setStart = useDesk((s) => s.setStart);
  const setFlyout = useDesk((s) => s.setFlyout);
  const setAsleep = useDesk((s) => s.setAsleep);
  const openApp = useDesk((s) => s.openApp);
  const setHost = useDesk((s) => s.setHost);
  const [now, setNow] = useState(() => new Date());
  const hasOpen = windows.some((w) => !w.minimized);

  useEffect(() => {
    void useDesk.persist.rehydrate();
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    let live = true;
    const hostTick = window.setInterval(() => {
      void sampleHost().then((h) => {
        if (live) setHost(h);
      });
    }, 2000);
    void sampleHost().then((h) => {
      if (live) setHost(h);
    });
    return () => {
      live = false;
      window.clearInterval(tick);
      window.clearInterval(hostTick);
    };
  }, [setHost]);

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-dusk text-ink"
      data-open={hasOpen ? "1" : "0"}
    >
      <h1 className="sr-only">Helix LLM desktop</h1>
      <img
        src="/wallpaper.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-dusk/30" />

      <div
        data-desktop
        className="absolute inset-0 bottom-16"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            setStart(false);
            setFlyout("none");
          }
        }}
      >
        <nav
          className={cn(
            "desk-icons absolute top-3 left-2 z-10 flex flex-col gap-1 p-1",
            "max-tab:inset-x-2 max-tab:grid max-tab:grid-cols-3 max-tab:gap-2",
            hasOpen && "max-tab:hidden",
          )}
          aria-label="Desktop"
        >
          {APPS.filter((a) => a.desktop).map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => openApp(app.id)}
              className="flex w-20 flex-col items-center gap-1 rounded-sm px-1 py-2 text-ink hover:bg-ink/10 max-tab:w-auto"
            >
              <span className="flex size-11 items-center justify-center rounded-sm bg-mica/80 shadow-[0_0_0_1px_rgb(255_255_255/0.08)] backdrop-blur-md">
                <app.icon className="size-5" strokeWidth={1.6} />
              </span>
              <span className="line-clamp-2 text-center text-xs font-medium leading-tight drop-shadow-[0_1px_2px_rgb(0_0_0/0.8)]">
                {app.title}
              </span>
            </button>
          ))}
        </nav>

        {windows.map((win) => (
          <WindowFrame key={win.id} win={win} />
        ))}
      </div>

      {startOpen ? (
        <>
          <button
            type="button"
            aria-label="Dismiss Start"
            className="absolute inset-0 z-30 cursor-default"
            onClick={() => setStart(false)}
          />
          <StartMenu />
        </>
      ) : null}

      <Taskbar now={now} />

      {asleep ? (
        <button
          type="button"
          className="absolute inset-0 z-50 flex flex-col items-center justify-end bg-dusk/55 pb-24 text-center backdrop-blur-[2px]"
          onClick={() => setAsleep(false)}
        >
          <div className="font-mono text-6xl tabular tracking-tight drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)]">
            {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </div>
          <div className="mt-2 text-sm text-ink/80">Click to wake Helix</div>
        </button>
      ) : null}
    </div>
  );
}
