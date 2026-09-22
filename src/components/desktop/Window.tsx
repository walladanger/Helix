import { useRef, type ReactNode } from "react";
import { Minus, Square, X } from "lucide-react";
import { appMeta } from "./apps-meta";
import { useDesk } from "@/lib/store";
import { clamp, cn } from "@/lib/utils";
import type { WinState } from "@/lib/types";

export function WindowFrame({ win }: { win: WinState }) {
  const focused = useDesk((s) => s.focused === win.id);
  const focusApp = useDesk((s) => s.focusApp);
  const closeApp = useDesk((s) => s.closeApp);
  const toggleMin = useDesk((s) => s.toggleMin);
  const toggleMax = useDesk((s) => s.toggleMax);
  const moveApp = useDesk((s) => s.moveApp);
  const resizeApp = useDesk((s) => s.resizeApp);
  const meta = appMeta(win.id);
  const View = meta.View;
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  return (
    <article
      className={cn(
        "desk-window absolute z-20 flex flex-col overflow-hidden bg-mica text-ink shadow-[var(--shadow-window)]",
        win.maximized
          ? "inset-0 h-full w-full rounded-none"
          : "rounded-lg max-tab:inset-0 max-tab:h-full max-tab:w-full max-tab:rounded-none",
        win.minimized && "pointer-events-none hidden",
      )}
      style={
        win.maximized
          ? { zIndex: win.z }
          : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }
      }
      onPointerDown={() => focusApp(win.id)}
    >
      <header
        className={cn(
          "flex h-10 shrink-0 items-center select-none",
          focused ? "bg-mica-2" : "bg-mica",
        )}
        onPointerDown={(e) => {
          if (win.maximized) return;
          if ((e.target as HTMLElement).closest("[data-caption]")) return;
          focusApp(win.id);
          drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const desk = e.currentTarget.closest("[data-desktop]") as HTMLElement | null;
          const bounds = desk?.getBoundingClientRect();
          const maxX = (bounds?.width ?? 1200) - 80;
          const maxY = (bounds?.height ?? 800) - 48;
          moveApp(
            win.id,
            clamp(e.clientX - drag.current.dx, -win.w + 80, maxX),
            clamp(e.clientY - drag.current.dy, 0, maxY),
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onDoubleClick={() => toggleMax(win.id)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 pl-3">
          <meta.icon className="size-3.5 text-muted" strokeWidth={1.75} />
          <span className="truncate text-xs font-medium">{meta.title}</span>
        </div>
        <div className="flex h-full" data-caption>
          <CaptionBtn label="Minimize" onClick={() => toggleMin(win.id)}>
            <Minus className="size-3.5" />
          </CaptionBtn>
          <CaptionBtn label="Maximize" onClick={() => toggleMax(win.id)}>
            <Square className="size-3" />
          </CaptionBtn>
          <CaptionBtn label="Close" danger onClick={() => closeApp(win.id)}>
            <X className="size-3.5" />
          </CaptionBtn>
        </div>
      </header>
      <div className="win-scroll min-h-0 flex-1 overflow-auto">
        <View />
      </div>
      {win.maximized ? null : (
        <span
          className="absolute right-0 bottom-0 hidden size-4 cursor-se-resize tab:block"
          onPointerDown={(e) => {
            e.stopPropagation();
            const start = { x: e.clientX, y: e.clientY, w: win.w, h: win.h };
            const move = (ev: PointerEvent) => {
              resizeApp(win.id, start.w + (ev.clientX - start.x), start.h + (ev.clientY - start.y));
            };
            const up = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
          }}
        />
      )}
    </article>
  );
}

function CaptionBtn({
  children,
  onClick,
  danger,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-full w-11 items-center justify-center text-muted transition-colors duration-150",
        danger ? "hover:bg-bad hover:text-ink" : "hover:bg-ink/10 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
