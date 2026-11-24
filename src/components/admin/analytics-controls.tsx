"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

const RANGES = [
  ["today", "Today"],
  ["7d", "7d"],
  ["30d", "30d"],
  ["90d", "90d"],
  ["12m", "12m"],
  ["custom", "Custom"],
] as const;

export const TABS = [
  ["overview", "Overview"],
  ["realtime", "Realtime"],
  ["pages", "Pages"],
  ["sources", "Sources"],
  ["audience", "Audience"],
  ["store", "Store funnel"],
  ["engagement", "Engagement"],
  ["performance", "Performance"],
] as const;

export function AnalyticsControls({ exportable }: { exportable: boolean }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = sp.get("tab") ?? "overview";
  const range = sp.get("range") ?? "30d";
  const compare = sp.get("compare") !== "0";
  const filters = [...sp.entries()].filter(([k]) => k.startsWith("f_"));

  const href = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    return `${pathname}?${next}`;
  };

  return (
    <div className="mb-6 space-y-4">
      <nav aria-label="Analytics screens" className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
        {TABS.map(([k, label]) => (
          <Link key={k} href={href({ tab: k })} scroll={false} aria-current={tab === k ? "page" : undefined} className={cn("relative shrink-0 px-3 py-2.5 text-14 transition-colors duration-150", tab === k ? "text-fg" : "text-muted hover:text-fg")}>
            {label}
            {tab === k && <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 rounded bg-accent-text" />}
          </Link>
        ))}
      </nav>

      {tab !== "realtime" && (
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Date range" className="flex rounded-lg border border-border p-0.5">
            {RANGES.map(([k, label]) => (
              <Link key={k} href={href({ range: k, ...(k !== "custom" ? { from: null, to: null } : {}) })} scroll={false} aria-current={range === k ? "true" : undefined} className={cn("h-8 rounded-md px-2.5 font-mono text-[0.75rem] leading-8", range === k ? "bg-surface-2 text-fg" : "text-subtle hover:text-fg")}>
                {label}
              </Link>
            ))}
          </div>
          {range === "custom" && (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                router.push(href({ from: String(fd.get("from")), to: String(fd.get("to")) }), { scroll: false });
              }}
            >
              <Input type="date" name="from" defaultValue={sp.get("from") ?? ""} aria-label="From" className="h-9 w-auto" required />
              <Input type="date" name="to" defaultValue={sp.get("to") ?? ""} aria-label="To" className="h-9 w-auto" required />
              <button type="submit" className={buttonClass({ variant: "outline", size: "sm" })}>
                Apply
              </button>
            </form>
          )}
          <Link href={href({ compare: compare ? "0" : null })} scroll={false} className={cn(buttonClass({ variant: "ghost", size: "sm" }), compare && "text-fg")} aria-pressed={compare}>
            <span aria-hidden className={cn("size-3 rounded-sm border", compare ? "border-accent-text bg-accent-text" : "border-border-strong")} /> Compare to previous
          </Link>
          {exportable && (
            <a href={`/api/admin/analytics/export?${sp}`} className={buttonClass({ variant: "ghost", size: "sm" }, "ml-auto")}>
              <Download aria-hidden /> CSV
            </a>
          )}
        </div>
      )}

      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.75rem] text-subtle">Filtered by</span>
          {filters.map(([k, v]) => (
            <Link key={k} href={href({ [k]: null })} scroll={false} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent-text/40 bg-accent-soft px-2.5 text-[0.75rem] text-accent-text">
              {k.slice(2)}: {v} <X className="size-3" aria-label="Remove filter" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
