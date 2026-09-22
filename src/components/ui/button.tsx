import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet";
};

export function Button({ variant = "primary", className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-3.5 text-sm font-medium",
        "transition-[transform,background-color,color,opacity] duration-150 ease-out",
        "active:not-disabled:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-accent text-accent-fg hover:bg-ink",
        variant === "ghost" && "bg-ink/10 text-ink hover:bg-ink/16",
        variant === "quiet" && "bg-transparent text-muted hover:bg-ink/10 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
