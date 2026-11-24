import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an amount in kobo as naira (the store sells in NGN only). */
export function formatMoney(minor: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US", { notation: n >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", opts).format(new Date(d));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

/** A Date `days` days before now (kept out of component bodies for render purity). */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 86400_000);
}

export function timeAgo(d: Date | string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
