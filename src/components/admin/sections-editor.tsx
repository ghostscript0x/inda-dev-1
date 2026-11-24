"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Loader2, Rocket, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { sectionDefs, type Field, type SectionType } from "@/lib/content";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { FieldEditor } from "./field-editor";
import { useAutosave, useSaveShortcut, useUnsavedWarning, VersionHistory } from "./editor-kit";
import type { MediaRef } from "./uploader";
import { discardSectionDraft, publishPage, publishSection, reorderSections, saveSectionDraft, setSectionVisible } from "@/app/admin/actions/content";

export type SectionRow = { id: string; type: SectionType; visible: boolean; data: Record<string, unknown>; hasDraft: boolean; revisions: { id: string; createdAt: string }[] };

function SectionCard({ row, media, onMedia, open, onToggle, onMove, first, last }: { row: SectionRow; media: Record<string, MediaRef>; onMedia: (m: MediaRef) => void; open: boolean; onToggle: () => void; onMove: (d: number) => void; first: boolean; last: boolean }) {
  const router = useRouter();
  const def = sectionDefs[row.type];
  const [value, setValue] = useState(row.data);
  const [savedJson, setSavedJson] = useState(JSON.stringify(row.data));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasDraft, setHasDraft] = useState(row.hasDraft);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(value) !== savedJson;
  useUnsavedWarning(dirty);

  async function saveDraft() {
    setStatus("saving");
    const res = await saveSectionDraft(row.id, value);
    if (!res.ok) {
      setStatus("error");
      toast.error(res.error);
      return false;
    }
    setSavedJson(JSON.stringify(value));
    setHasDraft(true);
    setStatus("saved");
    return true;
  }
  useAutosave(value, open && dirty, async () => void (await saveDraft()));
  useSaveShortcut(() => open && dirty && void saveDraft());

  return (
    <li className={cn("rounded-xl border bg-surface", open ? "border-border-strong" : "border-border")}>
      <div className="flex items-center gap-2 p-3 md:p-4">
        <div className="flex flex-col">
          <button type="button" disabled={first} onClick={() => onMove(-1)} className={buttonClass({ variant: "ghost", size: "icon-sm" }, "h-6")} aria-label={`Move ${def.label} up`}>
            <ArrowUp />
          </button>
          <button type="button" disabled={last} onClick={() => onMove(1)} className={buttonClass({ variant: "ghost", size: "icon-sm" }, "h-6")} aria-label={`Move ${def.label} down`}>
            <ArrowDown />
          </button>
        </div>
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="font-medium">{def.label}</span>
          {!row.visible && <Badge tone="muted">hidden</Badge>}
          {hasDraft && <Badge tone="warning">unpublished changes</Badge>}
          <ChevronDown className={cn("ml-auto size-4 text-subtle transition-transform duration-150", open && "rotate-180")} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() =>
            start(async () => {
              const res = await setSectionVisible(row.id, !row.visible);
              if (!res.ok) toast.error(res.error);
              else toast.success(res.message);
              router.refresh();
            })
          }
          className={buttonClass({ variant: "ghost", size: "icon-sm" })}
          aria-label={row.visible ? `Hide ${def.label}` : `Show ${def.label}`}
          title={row.visible ? "Hide section" : "Show section"}
        >
          {row.visible ? <Eye /> : <EyeOff />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border p-4 md:p-6">
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <FieldEditor fields={def.fields as Field[]} value={value} onChange={setValue} media={media} onMedia={onMedia} path={row.id} />
            </div>
            <div className="space-y-3 xl:col-span-4">
              <p className="text-[0.75rem] text-subtle" aria-live="polite">
                {status === "saving" ? "Saving draft…" : dirty ? "Unsaved changes" : status === "error" ? "Couldn’t save" : hasDraft ? "Draft saved (not live yet)" : "Matches the live site"}
              </p>
              <Button
                className="w-full"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await publishSection(row.id, value);
                    if (!res.ok) return void toast.error(res.error);
                    toast.success(res.message);
                    setSavedJson(JSON.stringify(value));
                    setHasDraft(false);
                    router.refresh();
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />} Publish section
              </Button>
              {hasDraft && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() =>
                    start(async () => {
                      const res = await discardSectionDraft(row.id);
                      if (!res.ok) return void toast.error(res.error);
                      toast.success(res.message);
                      router.refresh();
                    })
                  }
                >
                  <Undo2 aria-hidden /> Discard draft
                </Button>
              )}
              <VersionHistory revisions={row.revisions} onRestore={(d) => setValue(d as Record<string, unknown>)} />
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export function SectionsEditor({ page, rows, media: initialMedia }: { page: "home" | "about"; rows: SectionRow[]; media: Record<string, MediaRef> }) {
  const router = useRouter();
  const [order, setOrder] = useState(rows.map((r) => r.id));
  const [openId, setOpenId] = useState<string | null>(null);
  const [media, setMedia] = useState(initialMedia);
  const [pending, start] = useTransition();
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const anyDraft = rows.some((r) => r.hasDraft);

  function move(i: number, d: number) {
    const next = [...order];
    const [it] = next.splice(i, 1);
    next.splice(i + d, 0, it);
    setOrder(next);
    start(async () => {
      const res = await reorderSections(page, next);
      if (!res.ok) {
        toast.error(res.error);
        setOrder(order);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <a href={`/api/draft?path=${page === "home" ? "/" : "/about"}`} target="_blank" rel="noopener" className={buttonClass({ variant: "outline" })}>
          <Eye aria-hidden /> Preview drafts
        </a>
        <Button
          disabled={pending || !anyDraft}
          onClick={() =>
            start(async () => {
              const res = await publishPage(page);
              if (!res.ok) return void toast.error(res.error);
              toast.success(res.message);
              router.refresh();
            })
          }
        >
          <Rocket aria-hidden /> Publish all drafts
        </Button>
      </div>
      <ol className="space-y-3">
        {order.map((id, i) =>
          byId[id] ? (
            <SectionCard
              key={id}
              row={byId[id]}
              media={media}
              onMedia={(m) => setMedia((x) => ({ ...x, [m.id]: m }))}
              open={openId === id}
              onToggle={() => setOpenId(openId === id ? null : id)}
              onMove={(d) => move(i, d)}
              first={i === 0}
              last={i === order.length - 1}
            />
          ) : null,
        )}
      </ol>
    </div>
  );
}
