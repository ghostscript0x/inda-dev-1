"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Loader2, Plus, Rocket, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/misc";
import { FilePicker, GalleryPicker, type MediaRef } from "./uploader";
import { GeneratedLink, Section, Toggle, useAutosave, useSaveShortcut, useUnsavedWarning, VersionHistory } from "./editor-kit";
import { saveProduct, type ProductInput } from "@/app/admin/actions/products";
import { PRODUCT_CATEGORIES } from "@/lib/content";
import { slugify } from "@/lib/utils";

export type ProductEditorValue = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  whatsInside: string;
  audience: string;
  faqs: { q: string; a: string }[];
  priceNGN: string;
  isFree: boolean;
  category: keyof typeof PRODUCT_CATEGORIES;
  images: MediaRef[];
  file: MediaRef | null;
  videoUrl: string;
  featured: boolean;
  status: "draft" | "published" | "hidden";
  seoTitle: string;
  seoDescription: string;
};

export function ProductEditor({ initial, revisions, media }: { initial: ProductEditorValue; revisions: { id: string; createdAt: string }[]; media: Record<string, MediaRef> }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [pending, start] = useTransition();
  const [autosaving, setAutosaving] = useState(false);
  const dirty = JSON.stringify(v) !== saved;
  // Once a product has gone live its link is fixed (see saveProduct).
  const slugLocked = Boolean(v.id) && (JSON.parse(saved) as ProductEditorValue).status !== "draft";
  const set = <K extends keyof ProductEditorValue>(k: K, val: ProductEditorValue[K]) => setV((p) => ({ ...p, [k]: val }));

  useUnsavedWarning(dirty);

  function toInput(status = v.status): ProductInput {
    return {
      id: v.id,
      title: v.title,
      summary: v.summary,
      description: v.description,
      whatsInside: v.whatsInside
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      audience: v.audience,
      faqs: v.faqs.filter((f) => f.q.trim() && f.a.trim()),
      priceNGN: Number(v.priceNGN) || 0,
      isFree: v.isFree,
      category: v.category,
      coverId: v.images[0]?.id ?? null,
      galleryIds: v.images.slice(1).map((m) => m.id),
      videoUrl: v.videoUrl || null,
      fileId: v.file?.id ?? null,
      featured: v.featured,
      status,
      seoTitle: v.seoTitle,
      seoDescription: v.seoDescription,
    };
  }

  async function persist(status = v.status, quiet = false) {
    const next = { ...v, status };
    const res = await saveProduct(toInput(status));
    if (!res.ok) {
      if (!quiet) toast.error(res.error);
      return null;
    }
    const withId = { ...next, id: res.data!.id, slug: res.data!.slug };
    setV(withId);
    setSaved(JSON.stringify(withId));
    if (!quiet && res.message) toast.success(res.message);
    if (!v.id) router.replace(`/admin/products/${res.data!.id}`);
    else router.refresh();
    return withId;
  }

  const save = (status = v.status) => start(() => void persist(status));
  useSaveShortcut(() => save());

  // Autosave drafts only: published products change on purpose, via Publish.
  useAutosave(v, Boolean(v.id) && v.status === "draft" && dirty && v.title.length > 1 && v.summary.length > 4, async () => {
    setAutosaving(true);
    await persist("draft", true);
    setAutosaving(false);
  });

  async function preview() {
    const s = v.id && !dirty ? v : await persist(v.status);
    if (s) window.open(`/api/draft?path=/products/${s.slug}`, "_blank", "noopener");
  }

  function restore(data: unknown) {
    const d = data as Record<string, unknown>;
    setV((p) => ({
      ...p,
      title: String(d.title ?? p.title),
      summary: String(d.summary ?? p.summary),
      description: String(d.description ?? p.description),
      whatsInside: Array.isArray(d.whatsInside) ? (d.whatsInside as string[]).join("\n") : p.whatsInside,
      audience: String(d.audience ?? p.audience),
      faqs: Array.isArray(d.faqs) ? (d.faqs as { q: string; a: string }[]) : p.faqs,
      priceNGN: typeof d.priceNGN === "number" ? String(d.priceNGN / 100) : p.priceNGN,
      isFree: Boolean(d.isFree),
      images: [d.coverId, ...((d.galleryIds as string[]) ?? [])].filter((id): id is string => typeof id === "string" && Boolean(media[id])).map((id) => media[id]),
      file: typeof d.fileId === "string" && media[d.fileId] ? media[d.fileId] : p.file,
      videoUrl: String(d.videoUrl ?? ""),
    }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <Section id="file" title="1. File and preview images" description="The file is stored privately and only delivered after payment. The first image is the cover.">
          <Field label="Product file" htmlFor="file">
            <FilePicker value={v.file} onChange={(m) => set("file", m)} />
          </Field>
          <div>
            <p className="mb-1.5 text-14 font-medium">Preview images (1–5)</p>
            <GalleryPicker value={v.images} onChange={(m) => set("images", m)} />
          </div>
        </Section>

        <Section title="2. Details">
          <Field label="Name" htmlFor="p-title" hint={<GeneratedLink base="/products" slug={v.slug} locked={slugLocked} />}>
            <Input id="p-title" value={v.title} onChange={(e) => setV((p) => ({ ...p, title: e.target.value, slug: slugLocked ? p.slug : slugify(e.target.value) }))} maxLength={120} />
          </Field>
          <Field label="One-line summary" htmlFor="p-summary">
            <Input id="p-summary" value={v.summary} onChange={(e) => set("summary", e.target.value)} maxLength={200} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="p-cat">
              <Select id="p-cat" value={v.category} onChange={(e) => set("category", e.target.value as ProductEditorValue["category"])}>
                {Object.entries(PRODUCT_CATEGORIES).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Video preview (YouTube URL, optional)" htmlFor="p-video">
              <Input id="p-video" type="url" value={v.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtu.be/…" />
            </Field>
          </div>
          <Field label="Description" htmlFor="p-desc" hint="Blank line between paragraphs.">
            <Textarea id="p-desc" rows={7} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="What’s inside (one per line)" htmlFor="p-inside">
            <Textarea id="p-inside" rows={5} value={v.whatsInside} onChange={(e) => set("whatsInside", e.target.value)} />
          </Field>
          <Field label="Who it’s for" htmlFor="p-aud">
            <Textarea id="p-aud" rows={3} value={v.audience} onChange={(e) => set("audience", e.target.value)} />
          </Field>
          <div>
            <p className="mb-1.5 text-14 font-medium">FAQs</p>
            <div className="space-y-3">
              {v.faqs.map((f, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex gap-2">
                    <Input aria-label={`Question ${i + 1}`} placeholder="Question" value={f.q} onChange={(e) => set("faqs", v.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                    <button type="button" className={buttonClass({ variant: "ghost", size: "icon" })} onClick={() => set("faqs", v.faqs.filter((_, j) => j !== i))} aria-label="Remove question">
                      <Trash2 />
                    </button>
                  </div>
                  <Textarea aria-label={`Answer ${i + 1}`} placeholder="Answer" rows={2} className="min-h-0" value={f.a} onChange={(e) => set("faqs", v.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => set("faqs", [...v.faqs, { q: "", a: "" }])}>
                <Plus aria-hidden /> Add question
              </Button>
            </div>
          </div>
        </Section>

        <Section title="3. Price">
          <Toggle checked={v.isFree} onChange={(x) => set("isFree", x)} label="Free product" description="Buyers confirm their email, then download. Great for lead capture." />
          {!v.isFree && (
            <Field label="Price (₦)" htmlFor="p-ngn" hint="Buyers pay in naira through Paystack.">
              <Input id="p-ngn" inputMode="decimal" value={v.priceNGN} onChange={(e) => set("priceNGN", e.target.value.replace(/[^\d.]/g, ""))} className="max-w-xs font-mono" />
            </Field>
          )}
          <Toggle checked={v.featured} onChange={(x) => set("featured", x)} label="Featured" description="Shown first in the homepage Products section." />
        </Section>

        <Section title="Google & sharing" description="Generated from the name and summary. Nothing to fill in.">
          <SearchPreview path={`/products/${v.slug || "…"}`} title={v.seoTitle || v.title} description={v.seoDescription || v.summary} />
          <details className="group" open={Boolean(initial.seoTitle || initial.seoDescription)}>
            <summary className="cursor-pointer list-none text-[0.8125rem] text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Write your own instead</span>
              <span className="hidden group-open:inline">Custom text (leave blank to go back to automatic)</span>
            </summary>
            <div className="mt-4 space-y-5">
              <Field label="Title" htmlFor="p-seo-t" hint={`${v.seoTitle.length}/60`}>
                <Input id="p-seo-t" value={v.seoTitle} maxLength={60} placeholder={v.title} onChange={(e) => set("seoTitle", e.target.value)} />
              </Field>
              <Field label="Description" htmlFor="p-seo-d" hint={`${v.seoDescription.length}/155`}>
                <Textarea id="p-seo-d" rows={2} maxLength={155} placeholder={v.summary} value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
              </Field>
            </div>
          </details>
        </Section>
      </div>

      <aside className="xl:col-span-4">
        <div className="space-y-4 xl:sticky xl:top-20">
          <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
            <div className="flex items-center justify-between">
              <Badge tone={v.status === "published" ? "accent" : v.status === "hidden" ? "default" : "muted"}>{v.status}</Badge>
              <span className="text-[0.75rem] text-subtle" aria-live="polite">
                {autosaving ? "Autosaving…" : dirty ? "Unsaved changes" : v.id ? "All changes saved" : "New product"}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => save("published")} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />} {v.status === "published" ? "Save & update live" : "Publish"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => save(v.status === "published" ? "published" : "draft")} disabled={pending}>
                  <Save aria-hidden /> Save
                </Button>
                <Button variant="outline" onClick={preview} disabled={pending || !v.title}>
                  <Eye aria-hidden /> Preview
                </Button>
              </div>
              {v.status === "published" && (
                <Button variant="ghost" onClick={() => save("hidden")} disabled={pending}>
                  Hide from store
                </Button>
              )}
            </div>
            <p className="mt-3 text-[0.75rem] text-subtle">
              <kbd className="font-mono">Ctrl S</kbd> saves. Drafts autosave.
            </p>
          </div>
          <VersionHistory revisions={revisions} onRestore={restore} />
        </div>
      </aside>
    </div>
  );
}

/** How the product will look as a Google result. */
function SearchPreview({ path, title, description }: { path: string; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <p className="truncate text-[0.75rem] text-subtle">inda.name.ng{path}</p>
      <p className="mt-1 truncate text-16 text-accent-text">{(title || "Product name") + " — Abdul-Quddus Inda"}</p>
      <p className="mt-1 line-clamp-2 text-[0.8125rem] text-muted">{description || "Your one-line summary appears here."}</p>
    </div>
  );
}
