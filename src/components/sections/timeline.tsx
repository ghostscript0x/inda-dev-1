"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Item = { year: string; title: string; text: string };

/** Interactive timeline: pick an entry on the rail to read it. Arrow keys move between entries. */
export function Timeline({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items.length - 1);
  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)];

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-12">
      <ol role="tablist" aria-orientation="vertical" aria-label="Timeline" onKeyDown={onKey} className="relative md:col-span-5">
        <span aria-hidden className="absolute top-2 bottom-2 left-[5px] w-px bg-border" />
        {items.map((it, i) => (
          <li key={`${it.year}-${it.title}`} className="relative">
            <button
              type="button"
              role="tab"
              id={`tl-tab-${i}`}
              aria-selected={i === active}
              aria-controls="tl-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn("flex min-h-12 w-full items-center gap-4 rounded-md py-2 pr-3 text-left transition-colors duration-150", i === active ? "text-fg" : "text-muted hover:text-fg")}
            >
              <span aria-hidden className={cn("relative z-10 size-[11px] shrink-0 rounded-full border-2 transition-colors duration-150", i === active ? "border-accent bg-accent" : "border-border-strong bg-bg")} />
              <span className="w-14 shrink-0 font-mono text-[0.8125rem]">{it.year}</span>
              <span className="truncate text-14 font-medium">{it.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <div id="tl-panel" role="tabpanel" aria-labelledby={`tl-tab-${active}`} className="rounded-xl border border-border bg-surface p-6 md:col-span-7 md:p-8">
        <p className="font-mono text-14 text-accent-text">{current.year}</p>
        <h3 className="mt-2 text-24">{current.title}</h3>
        <p className="measure mt-3 leading-relaxed text-muted">{current.text}</p>
      </div>
    </div>
  );
}
