import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtMs(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 10) return `${n.toFixed(2)} ms`;
  if (n < 1000) return `${Math.round(n)} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}

export function fmtTps(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)} t/s`;
}

export function fmtUsd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) < 0.000001) return "$0";
  if (Math.abs(n) < 0.01) return `$${n.toFixed(6)}`;
  if (Math.abs(n) < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function fmtBytes(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs < 1024) return `${Math.round(n)} B`;
  if (abs < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (abs < 1024 ** 3) {
    const mb = n / 1024 ** 2;
    return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  }
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function fmtNum(n: number | null | undefined, digits = 1) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function fmtPct(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(0)}%`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function bitsPerChar(text: string) {
  if (text.length < 8) return null;
  const freq = new Map<string, number>();
  for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let h = 0;
  for (const c of freq.values()) {
    const p = c / text.length;
    h -= p * Math.log2(p);
  }
  return h;
}
