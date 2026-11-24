import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, tone = "default", ...p }: ComponentProps<"span"> & { tone?: "default" | "accent" | "warning" | "danger" | "muted" }) {
  const tones = {
    default: "border-border text-muted",
    accent: "border-accent-text/30 text-accent-text bg-accent-soft",
    warning: "border-warning/30 text-warning bg-warning/10",
    danger: "border-danger/30 text-danger bg-danger/10",
    muted: "border-transparent bg-surface-2 text-subtle",
  };
  return <span className={cn("inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[0.75rem] font-medium whitespace-nowrap", tones[tone], className)} {...p} />;
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-6 items-center rounded-md bg-surface-2 px-2 font-mono text-[0.75rem] text-muted">{children}</span>;
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-border bg-surface", className)} {...p} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {children ? <div className="measure mt-1.5 text-14 text-muted">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, intro, className, action }: { eyebrow?: string; title: string; intro?: string; className?: string; action?: ReactNode }) {
  return (
    <div className={cn("mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="text-32 md:text-40">{title}</h2>
        {intro ? <p className="measure mt-4 text-18 text-muted">{intro}</p> : null}
      </div>
      {action}
    </div>
  );
}
