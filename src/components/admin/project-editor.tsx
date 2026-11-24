"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { GalleryPicker, ImagePicker, type MediaRef } from "./uploader";
import { GeneratedLink, Section, Toggle, useSaveShortcut, useUnsavedWarning, VersionHistory } from "./editor-kit";
import { saveProject } from "@/app/admin/actions/site";
import { slugify } from "@/lib/utils";
import type { ProjectContent } from "@/lib/content";

export type ProjectEditorValue = {
  id?: string;
  title: string;
  slug: string;
  pillar: "build" | "secure" | "automate";
  industry: string;
  summary: string;
  result: string;
  content: ProjectContent;
  stack: string;
  results: { label: string; value: string }[];
  cover: MediaRef | null;
  gallery: MediaRef[];
  liveUrl: string;
  repoUrl: string;
  published: boolean;
};

const CONTENT_FIELDS: { key: keyof ProjectContent; label: string; rows: number; mono?: boolean; hint?: string }[] = [
  { key: "problem", label: "Problem", rows: 4, hint: "Who was it for and what hurt? Blank line between paragraphs." },
  { key: "approach", label: "Approach", rows: 5 },
  { key: "architecture", label: "Architecture diagram", rows: 8, mono: true, hint: "Plain-text diagram, shown in a mono block." },
  { key: "code", label: "Key code", rows: 10, mono: true },
  { key: "results", label: "Results", rows: 4, hint: "Real numbers only." },
];

export function ProjectEditor({ initial, revisions }: { initial: ProjectEditorValue; revisions: { id: string; createdAt: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(v) !== saved;
  // Once a case study has been published its link is fixed (see saveProject).
  const slugLocked = Boolean(v.id) && (JSON.parse(saved) as ProjectEditorValue).published;
  const set = <K extends keyof ProjectEditorValue>(k: K, val: ProjectEditorValue[K]) => setV((p) => ({ ...p, [k]: val }));
  useUnsavedWarning(dirty);

  function save(after?: (slug: string) => void) {
    start(async () => {
      const res = await saveProject({
        id: v.id,
        title: v.title,
        pillar: v.pillar,
        industry: v.industry,
        summary: v.summary,
        result: v.result,
        content: v.content,
        stack: v.stack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        results: v.results.filter((r) => r.label && r.value),
        coverId: v.cover?.id ?? null,
        galleryIds: v.gallery.map((g) => g.id),
        liveUrl: v.liveUrl || null,
        repoUrl: v.repoUrl || null,
        published: v.published,
      });
      if (!res.ok) return void toast.error(res.error);
      const next = { ...v, id: res.data!.id, slug: res.data!.slug };
      setV(next);
      setSaved(JSON.stringify(next));
      toast.success(res.message);
      if (!v.id) router.replace(`/admin/work/${res.data!.id}`);
      else router.refresh();
      after?.(res.data!.slug);
    });
  }
  useSaveShortcut(() => save());

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <Section title="Overview">
          <Field label="Title" htmlFor="w-title" hint={<GeneratedLink base="/work" slug={v.slug} locked={slugLocked} />}>
            <Input id="w-title" value={v.title} onChange={(e) => setV((p) => ({ ...p, title: e.target.value, slug: slugLocked ? p.slug : slugify(e.target.value) }))} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Pillar" htmlFor="w-pillar">
              <Select id="w-pillar" value={v.pillar} onChange={(e) => set("pillar", e.target.value as ProjectEditorValue["pillar"])}>
                <option value="build">Build — Software Engineering</option>
                <option value="secure">Secure — Cybersecurity & Networking</option>
                <option value="automate">Automate — AI Automation</option>
              </Select>
            </Field>
            <Field label="Industry" htmlFor="w-ind">
              <Input id="w-ind" value={v.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Education, logistics…" />
            </Field>
          </div>
          <Field label="Summary" htmlFor="w-sum">
            <Textarea id="w-sum" rows={2} value={v.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>
          <Field label="One-line result" htmlFor="w-res" hint="e.g. Cut invoice processing from 3 hours to 10 minutes.">
            <Input id="w-res" value={v.result} onChange={(e) => set("result", e.target.value)} />
          </Field>
          <Field label="Stack (comma-separated)" htmlFor="w-stack">
            <Input id="w-stack" value={v.stack} onChange={(e) => set("stack", e.target.value)} placeholder="Next.js, Postgres, n8n" />
          </Field>
        </Section>

        <Section title="Key numbers" description="Up to 3, shown at the top of the case study.">
          {v.results.map((r, i) => (
            <div key={i} className="flex items-end gap-2">
              <Field label="Value" htmlFor={`w-rv-${i}`} className="w-32">
                <Input id={`w-rv-${i}`} value={r.value} onChange={(e) => set("results", v.results.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className="font-mono" />
              </Field>
              <Field label="Label" htmlFor={`w-rl-${i}`} className="flex-1">
                <Input id={`w-rl-${i}`} value={r.label} onChange={(e) => set("results", v.results.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              </Field>
              <button type="button" onClick={() => set("results", v.results.filter((_, j) => j !== i))} className={buttonClass({ variant: "ghost", size: "icon" })} aria-label="Remove number">
                <Trash2 />
              </button>
            </div>
          ))}
          {v.results.length < 3 && (
            <Button variant="outline" size="sm" onClick={() => set("results", [...v.results, { value: "", label: "" }])}>
              <Plus aria-hidden /> Add number
            </Button>
          )}
        </Section>

        <Section title="Story" description="Problem → Approach → Architecture → Key code → Results.">
          {CONTENT_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} htmlFor={`w-${f.key}`} hint={f.hint}>
              <Textarea id={`w-${f.key}`} rows={f.rows} className={f.mono ? "font-mono text-[0.8125rem]" : undefined} value={v.content[f.key]} onChange={(e) => set("content", { ...v.content, [f.key]: e.target.value })} spellCheck={!f.mono} />
            </Field>
          ))}
          <Field label="Code language" htmlFor="w-lang">
            <Input id="w-lang" className="w-40 font-mono" value={v.content.codeLang} onChange={(e) => set("content", { ...v.content, codeLang: e.target.value })} />
          </Field>
        </Section>

        <Section title="Screenshots">
          <div>
            <p className="mb-1.5 text-14 font-medium">Cover (real screenshot)</p>
            <ImagePicker value={v.cover} onChange={(m) => set("cover", m)} />
          </div>
          <div>
            <p className="mb-1.5 text-14 font-medium">Gallery</p>
            <GalleryPicker value={v.gallery} onChange={(m) => set("gallery", m)} max={8} />
          </div>
        </Section>

        <Section title="Links">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Live URL" htmlFor="w-live">
              <Input id="w-live" type="url" value={v.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} />
            </Field>
            <Field label="GitHub URL" htmlFor="w-repo">
              <Input id="w-repo" type="url" value={v.repoUrl} onChange={(e) => set("repoUrl", e.target.value)} />
            </Field>
          </div>
        </Section>
      </div>
      <aside className="xl:col-span-4">
        <div className="space-y-4 xl:sticky xl:top-20">
          <div className="space-y-4 rounded-xl border border-border bg-surface p-4 md:p-5">
            <Toggle checked={v.published} onChange={(x) => set("published", x)} label="Published" description="Visible on the homepage and its own page." />
            <p className="text-[0.75rem] text-subtle">{dirty ? "Unsaved changes" : v.id ? "All changes saved" : "New case study"}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => save()} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Save
              </Button>
              <Button variant="outline" disabled={pending || !v.title} onClick={() => save((slug) => window.open(`/api/draft?path=/work/${slug}`, "_blank", "noopener"))}>
                <Eye aria-hidden /> Preview
              </Button>
            </div>
          </div>
          <VersionHistory
            revisions={revisions}
            onRestore={(d) => {
              const x = d as Record<string, unknown>;
              setV((p) => ({
                ...p,
                title: String(x.title ?? p.title),
                summary: String(x.summary ?? p.summary),
                result: String(x.result ?? p.result),
                industry: String(x.industry ?? p.industry),
                content: (x.content as ProjectContent) ?? p.content,
                stack: Array.isArray(x.stack) ? (x.stack as string[]).join(", ") : p.stack,
                results: (x.results as ProjectEditorValue["results"]) ?? p.results,
              }));
            }}
          />
        </div>
      </aside>
    </div>
  );
}
