"use client";

import { useEffect, useRef, useState } from "react";
import { History, Link2 } from "lucide-react";
import { toast } from "sonner";
import { getRevisionData } from "@/app/admin/actions/revisions";
import { formatDate } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

/** Warn before leaving with unsaved changes. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);
}

/** Ctrl/Cmd+S runs the save handler. */
export function useSaveShortcut(save: () => void) {
  const ref = useRef(save);
  useEffect(() => {
    ref.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Debounced autosave while `enabled` and the value has changed. */
export function useAutosave(value: unknown, enabled: boolean, save: () => Promise<void>, delay = 2500) {
  const first = useRef(true);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  const serialized = JSON.stringify(value);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!enabled) return;
    const t = setTimeout(() => void saveRef.current(), delay);
    return () => clearTimeout(t);
  }, [serialized, enabled, delay]);
}

export function VersionHistory({ revisions, onRestore }: { revisions: { id: string; createdAt: string }[]; onRestore: (data: unknown) => void }) {
  const [open, setOpen] = useState(false);
  if (!revisions.length) return null;
  return (
    <div className="rounded-xl border border-border">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-14">
        <span className="flex items-center gap-2">
          <History className="size-4 text-subtle" aria-hidden /> Version history
        </span>
        <span className="font-mono text-[0.75rem] text-subtle">{revisions.length}</span>
      </button>
      {open && (
        <ul className="max-h-72 divide-y divide-border overflow-y-auto border-t border-border">
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[0.8125rem]">
              <span className="font-mono text-muted">{formatDate(r.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              <button
                type="button"
                className={buttonClass({ variant: "ghost", size: "sm" })}
                onClick={async () => {
                  const rev = await getRevisionData(r.id);
                  if (!rev) return void toast.error("That version no longer exists.");
                  onRestore(rev.data);
                  toast.success("Version loaded into the editor. Save to keep it.");
                }}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Section({ title, description, children, id }: { title: string; description?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-xl border border-border bg-surface p-4 md:p-6">
      <h2 className="font-medium">{title}</h2>
      {description && <p className="mt-0.5 text-[0.8125rem] text-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-14 font-medium">{label}</span>
        {description && <span className="block text-[0.8125rem] text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ${checked ? "bg-accent" : "bg-border-strong"}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-150 ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

/** The page address, generated from the title. Shown read-only under the title field. */
export function GeneratedLink({ base, slug, locked }: { base: string; slug: string; locked: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Link2 className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate font-mono">
        {base}/<span className="text-muted">{slug || "…"}</span>
      </span>
      <span className="shrink-0">· {locked ? "fixed since it went live" : "made from the name"}</span>
    </span>
  );
}
