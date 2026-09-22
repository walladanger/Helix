import { Power, Search } from "lucide-react";
import { APPS } from "./apps-meta";
import { useDesk } from "@/lib/store";
import { cn } from "@/lib/utils";

export function StartMenu() {
  const search = useDesk((s) => s.search);
  const setSearch = useDesk((s) => s.setSearch);
  const openApp = useDesk((s) => s.openApp);
  const setAsleep = useDesk((s) => s.setAsleep);
  const setStart = useDesk((s) => s.setStart);
  const q = search.trim().toLowerCase();
  const listed = APPS.filter(
    (a) => !q || a.title.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q),
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[60px] z-40 flex justify-center px-3">
      <div
        className="pointer-events-auto w-full max-w-[560px] origin-bottom rounded-lg bg-mica p-4 shadow-[var(--shadow-window)]"
        role="dialog"
        aria-label="Start"
      >
        <label className="flex h-11 items-center gap-2 rounded-sm bg-dusk px-3 ring-1 ring-ink/10">
          <Search className="size-4 text-faint" strokeWidth={1.75} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps"
            className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            autoFocus
          />
        </label>
        <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-muted uppercase">Pinned</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {listed.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => {
                openApp(app.id);
                setSearch("");
              }}
              className={cn("flex flex-col items-center gap-2 rounded-md px-2 py-3 text-center hover:bg-ink/8")}
            >
              <span className="flex size-11 items-center justify-center rounded-sm bg-ink/10">
                <app.icon className="size-5" strokeWidth={1.6} />
              </span>
              <span className="text-xs font-medium">{app.title}</span>
            </button>
          ))}
        </div>
        {listed.length === 0 ? (
          <p className="py-6 text-center text-sm text-faint">No matching apps</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
          <span className="text-xs text-muted">Helix</span>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-sm text-muted hover:bg-ink/10 hover:text-ink"
            aria-label="Sleep"
            onClick={() => {
              setStart(false);
              setAsleep(true);
            }}
          >
            <Power className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
