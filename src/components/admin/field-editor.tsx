"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Field } from "@/lib/content";
import { Field as FieldWrap, Input, Select, Textarea } from "@/components/ui/field";
import { Button, buttonClass } from "@/components/ui/button";
import { Toggle } from "./editor-kit";
import { ImagePicker, type MediaRef } from "./uploader";

type Obj = Record<string, unknown>;

/** Default value for a field, used when adding list items. */
function blank(f: Field): unknown {
  switch (f.kind) {
    case "boolean":
      return false;
    case "image":
      return null;
    case "strings":
      return [];
    case "list":
      return [];
    case "object":
      return Object.fromEntries(f.fields.map((x) => [x.name, blank(x)]));
    case "select":
      return f.options[0]?.value ?? "";
    default:
      return "";
  }
}

/** Renders an admin form from a section's field spec. Content changes freely; layout stays fixed. */
export function FieldEditor({ fields, value, onChange, media, onMedia, path = "f" }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void; media: Record<string, MediaRef>; onMedia: (m: MediaRef) => void; path?: string }) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });

  return (
    <div className="space-y-5">
      {fields.map((f) => {
        const id = `${path}-${f.name}`;
        const v = value[f.name];
        switch (f.kind) {
          case "text":
          case "url":
            return (
              <FieldWrap key={f.name} label={f.label} htmlFor={id} hint={"help" in f ? f.help : undefined}>
                <Input id={id} type={f.kind === "url" ? "url" : "text"} value={String(v ?? "")} maxLength={"max" in f ? f.max : undefined} onChange={(e) => set(f.name, e.target.value)} />
              </FieldWrap>
            );
          case "textarea":
            return (
              <FieldWrap key={f.name} label={f.label} htmlFor={id} hint={f.max ? `${String(v ?? "").length}/${f.max}` : f.help}>
                <Textarea id={id} rows={3} value={String(v ?? "")} maxLength={f.max} onChange={(e) => set(f.name, e.target.value)} />
              </FieldWrap>
            );
          case "boolean":
            return <Toggle key={f.name} label={f.label} description={f.help} checked={Boolean(v)} onChange={(x) => set(f.name, x)} />;
          case "select":
            return (
              <FieldWrap key={f.name} label={f.label} htmlFor={id}>
                <Select id={id} value={String(v ?? "")} onChange={(e) => set(f.name, e.target.value)}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FieldWrap>
            );
          case "strings": {
            const arr = Array.isArray(v) ? (v as string[]) : [];
            return (
              <FieldWrap key={f.name} label={f.label} htmlFor={id} hint={f.help}>
                <Textarea id={id} rows={Math.min(10, Math.max(3, arr.length + 1))} value={arr.join("\n")} onChange={(e) => set(f.name, e.target.value.split("\n"))} onBlur={(e) => set(f.name, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />
              </FieldWrap>
            );
          }
          case "image": {
            const mid = typeof v === "string" ? v : null;
            return (
              <div key={f.name}>
                <p className="mb-1.5 text-14 font-medium">{f.label}</p>
                <ImagePicker
                  value={mid ? (media[mid] ?? { id: mid, url: "", filename: "Image" }) : null}
                  onChange={(m) => {
                    if (m) onMedia(m);
                    set(f.name, m?.id ?? null);
                  }}
                />
              </div>
            );
          }
          case "object":
            return (
              <fieldset key={f.name} className="rounded-lg border border-border p-4">
                <legend className="px-1 text-14 font-medium">{f.label}</legend>
                <FieldEditor fields={f.fields} value={(v as Obj) ?? {}} onChange={(x) => set(f.name, x)} media={media} onMedia={onMedia} path={id} />
              </fieldset>
            );
          case "list": {
            const items = Array.isArray(v) ? (v as Obj[]) : [];
            const move = (i: number, d: number) => {
              const next = [...items];
              const [it] = next.splice(i, 1);
              next.splice(i + d, 0, it);
              set(f.name, next);
            };
            return (
              <fieldset key={f.name}>
                <legend className="mb-2 text-14 font-medium">{f.label}</legend>
                <ol className="space-y-3">
                  {items.map((item, i) => (
                    <li key={i} className="rounded-lg border border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-mono text-[0.75rem] text-subtle">
                          {f.itemLabel} {i + 1}
                        </span>
                        <div className="flex gap-1">
                          <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={buttonClass({ variant: "ghost", size: "icon-sm" })} aria-label="Move up">
                            <ArrowUp />
                          </button>
                          <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className={buttonClass({ variant: "ghost", size: "icon-sm" })} aria-label="Move down">
                            <ArrowDown />
                          </button>
                          <button type="button" onClick={() => set(f.name, items.filter((_, j) => j !== i))} className={buttonClass({ variant: "ghost", size: "icon-sm" }, "text-danger")} aria-label={`Remove ${f.itemLabel}`}>
                            <Trash2 />
                          </button>
                        </div>
                      </div>
                      <FieldEditor fields={f.fields} value={item} onChange={(x) => set(f.name, items.map((y, j) => (j === i ? x : y)))} media={media} onMedia={onMedia} path={`${id}-${i}`} />
                    </li>
                  ))}
                </ol>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => set(f.name, [...items, Object.fromEntries(f.fields.map((x) => [x.name, blank(x)]))])}>
                  <Plus aria-hidden /> Add {f.itemLabel.toLowerCase()}
                </Button>
              </fieldset>
            );
          }
        }
      })}
    </div>
  );
}
