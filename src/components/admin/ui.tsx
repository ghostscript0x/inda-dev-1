import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./charts";

export function Panel({ title, description, action, children, className, flush }: { title?: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("flex flex-col rounded-xl border border-border bg-surface", className)}>
      {title && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4 md:px-5">
          <div className="min-w-0">
            <h2 className="text-14 font-medium">{title}</h2>
            {description && <p className="mt-0.5 text-[0.8125rem] text-subtle">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("flex-1", flush ? "pt-3" : "p-4 md:p-5", title && !flush && "pt-3 md:pt-3")}>{children}</div>
    </section>
  );
}

/** Small "+12%" / "−8%" pill. `invert` for metrics where down is good (bounce rate). */
export function Delta({ value, invert, className }: { value: number | null | undefined; invert?: boolean; className?: string }) {
  if (value == null || !Number.isFinite(value)) return null;
  const good = invert ? value < 0 : value > 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono text-[0.75rem] tabular-nums", value === 0 ? "text-subtle" : good ? "text-accent-text" : "text-danger", className)}>
      {value !== 0 && <Icon className="size-3" aria-hidden />}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

export function Stat({ label, value, sub, delta, spark, href, invert }: { label: string; value: ReactNode; sub?: ReactNode; delta?: number | null; spark?: number[]; href?: string; invert?: boolean }) {
  const body = (
    <>
      <p className="text-[0.8125rem] text-muted">{label}</p>
      <p className="mt-2 font-mono text-24 leading-none font-medium tracking-tight tabular-nums">{value}</p>
      <div className="mt-2 flex h-4 items-center gap-2 text-[0.75rem]">
        <Delta value={delta} invert={invert} />
        {sub && <span className="truncate text-subtle">{sub}</span>}
      </div>
      {spark && spark.some((v) => v > 0) && <Sparkline data={spark} className="mt-3 h-7" />}
    </>
  );
  const cls = "block rounded-xl border border-border bg-surface p-4 md:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors duration-150 hover:border-border-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Table on desktop; each row becomes a stacked card on phones. */
export function ResponsiveTable({ head, children, empty, align }: { head: string[]; children: ReactNode; empty?: ReactNode; align?: ("left" | "right")[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-14 max-md:block">
        <thead className="border-b border-border max-md:hidden">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className={cn("h-10 px-4 text-[0.75rem] font-medium whitespace-nowrap text-subtle", align?.[i] === "right" && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border max-md:block">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("transition-colors duration-150 hover:bg-surface-2/40 max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-4 max-md:gap-y-1.5 max-md:p-4", className)}>{children}</tr>;
}

export function Cell({ children, className, label, primary }: { children: ReactNode; className?: string; label?: string; primary?: boolean }) {
  return (
    <td className={cn("px-4 py-3 align-middle max-md:p-0", primary && "max-md:w-full", className)}>
      {label && <span className="mr-1.5 text-[0.75rem] text-subtle md:hidden">{label}</span>}
      {children}
    </td>
  );
}

/** Segmented filter (status tabs etc.) driven by a query param. */
export function FilterLinks({ base, param, current, options }: { base: string; param: string; current?: string; options: { value: string; label: string; count?: number }[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="inline-flex gap-0.5 rounded-lg border border-border bg-surface p-0.5">
        {options.map((o) => {
          const active = (current ?? "") === o.value;
          const href = o.value ? `${base}?${param}=${encodeURIComponent(o.value)}` : base;
          return (
            <Link
              key={o.value}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[0.8125rem] transition-colors duration-150", active ? "bg-surface-2 font-medium text-fg shadow-sm" : "text-muted hover:text-fg")}
            >
              {o.label}
              {o.count != null && <span className={cn("font-mono text-[0.6875rem]", active ? "text-muted" : "text-subtle")}>{o.count}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const statusTone = (s: string) =>
  (({ published: "accent", paid: "accent", replied: "accent", approved: "accent", draft: "muted", pending: "warning", awaiting_confirmation: "warning", new: "warning", hidden: "default", failed: "danger", refunded: "danger", archived: "muted" }) as const)[s as "paid"] ?? "default";

/** Human labels for raw status values. */
export const statusLabel = (s: string) => ({ awaiting_confirmation: "Awaiting email", published: "Live" })[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
