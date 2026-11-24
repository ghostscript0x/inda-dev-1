"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { PILLARS } from "@/lib/content";
import { deleteProject, reorderProjects } from "@/app/admin/actions/site";
import { useRun } from "./product-row-actions";

type P = { id: string; title: string; slug: string; pillar: string; result: string; published: boolean };

export function WorkList({ projects }: { projects: P[] }) {
  const [list, setList] = useState(projects);
  const { run } = useRun();
  function move(i: number, d: number) {
    const next = [...list];
    const [it] = next.splice(i, 1);
    next.splice(i + d, 0, it);
    setList(next);
    run(() => reorderProjects(next.map((p) => p.id)));
  }
  return (
    <ol className="space-y-2">
      {list.map((p, i) => (
        <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 md:p-4">
          <div className="flex flex-col">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={buttonClass({ variant: "ghost", size: "icon-sm" }, "h-6")} aria-label={`Move ${p.title} up`}>
              <ArrowUp />
            </button>
            <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className={buttonClass({ variant: "ghost", size: "icon-sm" }, "h-6")} aria-label={`Move ${p.title} down`}>
              <ArrowDown />
            </button>
          </div>
          <span className="font-mono text-[0.75rem] text-subtle">{String(i + 1).padStart(2, "0")}</span>
          <Link href={`/admin/work/${p.id}`} className="min-w-0 flex-1">
            <span className="block truncate font-medium hover:text-accent-text">{p.title}</span>
            <span className="block truncate text-[0.8125rem] text-muted">
              {PILLARS[p.pillar as keyof typeof PILLARS]?.label} · {p.result}
            </span>
          </Link>
          <Badge tone={p.published ? "accent" : "muted"}>{p.published ? "live" : "draft"}</Badge>
          <a href={`/api/draft?path=/work/${p.slug}`} target="_blank" rel="noopener" className={buttonClass({ variant: "ghost", size: "icon-sm" })} aria-label="Preview">
            <Eye />
          </a>
          <button type="button" onClick={() => confirm(`Delete “${p.title}”?`) && run(() => deleteProject(p.id), () => setList((l) => l.filter((x) => x.id !== p.id)))} className={buttonClass({ variant: "ghost", size: "icon-sm" }, "text-danger")} aria-label="Delete">
            <Trash2 />
          </button>
        </li>
      ))}
    </ol>
  );
}
