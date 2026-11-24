"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn, formatDate } from "@/lib/utils";
import { useRun } from "./product-row-actions";
import { useSaveShortcut, useUnsavedWarning } from "./editor-kit";
import { saveLegal } from "@/app/admin/actions/site";

type Doc = { slug: "privacy" | "terms" | "refunds" | "license"; title: string; body: string; updatedAt: string | null };

export function LegalEditor({ docs }: { docs: Doc[] }) {
  const [active, setActive] = useState(docs[0].slug);
  const [state, setState] = useState(docs);
  const [saved, setSaved] = useState(JSON.stringify(docs));
  const { run, pending } = useRun();
  const doc = state.find((d) => d.slug === active)!;
  const dirty = JSON.stringify(state) !== saved;
  useUnsavedWarning(dirty);
  const upd = (patch: Partial<Doc>) => setState(state.map((d) => (d.slug === active ? { ...d, ...patch } : d)));
  const save = () =>
    run(
      () => saveLegal({ slug: doc.slug, title: doc.title, body: doc.body }),
      () => {
        const next = state.map((d) => (d.slug === active ? { ...d, updatedAt: new Date().toISOString() } : d));
        setState(next);
        setSaved(JSON.stringify(next));
      },
    );
  useSaveShortcut(save);

  return (
    <div className="max-w-4xl">
      <div role="tablist" className="mb-4 flex gap-1.5 overflow-x-auto">
        {state.map((d) => (
          <button key={d.slug} role="tab" type="button" aria-selected={d.slug === active} onClick={() => setActive(d.slug)} className={cn("h-9 shrink-0 rounded-full border px-4 text-14", d.slug === active ? "border-fg bg-fg text-bg" : "border-border text-muted hover:text-fg")}>
            {d.title}
          </button>
        ))}
      </div>
      <div className="space-y-4 rounded-xl border border-border bg-surface p-4 md:p-6">
        <p className="font-mono text-[0.75rem] text-subtle">
          /{doc.slug} · last updated {doc.updatedAt ? formatDate(doc.updatedAt) : "never"}
        </p>
        <Field label="Title" htmlFor="lg-title">
          <Input id="lg-title" value={doc.title} onChange={(e) => upd({ title: e.target.value })} />
        </Field>
        <Field label="Content" htmlFor="lg-body" hint="Markdown: ## heading, ### subheading, - list item, **bold**, [link](https://…). Blank line between paragraphs.">
          <Textarea id="lg-body" rows={24} className="font-mono text-[0.8125rem]" value={doc.body} onChange={(e) => upd({ body: e.target.value })} />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <a href={`/${doc.slug}`} target="_blank" rel="noopener" className="link text-14">
            View live page
          </a>
          <Button onClick={save} disabled={pending}>
            Publish {doc.title.toLowerCase()}
          </Button>
        </div>
      </div>
      <p className="mt-4 text-[0.8125rem] text-muted">These are general templates, not legal advice. Have a Nigerian lawyer review them once before launch.</p>
    </div>
  );
}
