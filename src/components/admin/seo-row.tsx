"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImagePicker, type MediaRef } from "./uploader";
import { useRun } from "./product-row-actions";
import { saveSeo } from "@/app/admin/actions/site";

export function SeoRow({ path, label, initial }: { path: string; label: string; initial: { title: string; description: string; og: MediaRef | null } }) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [og, setOg] = useState(initial.og);
  const { run, pending } = useRun();
  return (
    <details className="group rounded-xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">{label}</span>
          <span className="block font-mono text-[0.75rem] text-subtle">{path}</span>
        </span>
        <span className="text-[0.75rem] text-muted">{initial.title || initial.description ? "Custom" : "Automatic"}</span>
      </summary>
      <form
        className="space-y-4 border-t border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveSeo({ path, title, description, ogImageId: og?.id ?? null }));
        }}
      >
        <Field label="Title" htmlFor={`seo-t-${path}`} hint={`${title.length}/60 · shown as “Title — Abdul-Quddus Inda”`}>
          <Input id={`seo-t-${path}`} value={title} maxLength={60} placeholder="Automatic. Leave blank unless you want your own." onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Description" htmlFor={`seo-d-${path}`} hint={`${description.length}/155`}>
          <Textarea id={`seo-d-${path}`} rows={2} value={description} maxLength={155} placeholder="Automatic. Leave blank unless you want your own." onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1.5 text-14 font-medium">Share image (optional)</p>
          <p className="mb-2 text-[0.8125rem] text-muted">Leave empty to use the auto-generated branded image.</p>
          <ImagePicker value={og} onChange={setOg} label="Drop a 1200×630 image" />
        </div>
        <Button type="submit" disabled={pending}>
          Save
        </Button>
      </form>
    </details>
  );
}
