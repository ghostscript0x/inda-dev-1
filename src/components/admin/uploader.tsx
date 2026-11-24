"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, FileArchive, GripVertical, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

export type MediaRef = { id: string; url: string; filename: string; bytes?: number };

type Sign = { direct: false } | { direct: true; uploadUrl: string; apiKey: string; timestamp: number; signature: string; folder: string; type: string; resourceType: "image" | "raw" };

async function post<T>(body: BodyInit, json = true): Promise<T> {
  const res = await fetch("/api/admin/upload", { method: "POST", body, headers: json ? { "content-type": "application/json" } : undefined });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Upload failed (HTTP ${res.status})`);
  return data;
}

/** Upload one file: straight to Cloudinary when configured, otherwise through the server. */
export async function uploadFile(file: File, isPrivate: boolean, onProgress?: (pct: number) => void): Promise<MediaRef> {
  const sign = await post<Sign>(JSON.stringify({ action: "sign", private: isPrivate }));
  if (!sign.direct) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("private", isPrivate ? "1" : "0");
    const { media } = await post<{ media: MediaRef }>(fd, false);
    return media;
  }
  const fd = new FormData();
  fd.set("file", file);
  fd.set("api_key", sign.apiKey);
  fd.set("timestamp", String(sign.timestamp));
  fd.set("signature", sign.signature);
  fd.set("folder", sign.folder);
  fd.set("type", sign.type);
  const uploaded = await new Promise<{ public_id: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sign.uploadUrl);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const body = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body?.error?.message ?? `Cloudinary upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(fd);
  });
  const { media } = await post<{ media: MediaRef }>(
    JSON.stringify({ action: "register", publicId: uploaded.public_id, resourceType: sign.resourceType, private: isPrivate, filename: file.name, mime: file.type || "application/octet-stream" }),
  );
  return media;
}

function useUpload(isPrivate: boolean) {
  const [busy, setBusy] = useState<number | null>(null);
  async function run(files: File[], onDone: (m: MediaRef) => void) {
    for (const f of files) {
      setBusy(0);
      try {
        onDone(await uploadFile(f, isPrivate, setBusy));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(null);
      }
    }
  }
  return { busy, run };
}

function DropZone({ onFiles, accept, multiple, busy, label, hint, camera }: { onFiles: (f: File[]) => void; accept: string; multiple?: boolean; busy: number | null; label: string; hint: string; camera?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center transition-colors duration-150", over ? "border-accent-text bg-accent-soft" : "border-border-strong")}
    >
      {busy !== null ? <Loader2 className="size-6 animate-spin text-accent-text" aria-hidden /> : <Upload className="size-6 text-subtle" aria-hidden />}
      <p className="text-14">{busy !== null ? `Uploading… ${busy}%` : label}</p>
      <p className="text-[0.8125rem] text-subtle">{hint}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={buttonClass({ variant: "outline", size: "sm" })} onClick={() => input.current?.click()} disabled={busy !== null}>
          Choose file{multiple ? "s" : ""}
        </button>
        {camera && (
          <button type="button" className={buttonClass({ variant: "outline", size: "sm" }, "md:hidden")} onClick={() => cam.current?.click()} disabled={busy !== null}>
            <Camera aria-hidden /> Take photo
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={accept} multiple={multiple} hidden onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))} />
      {camera && <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))} />}
    </div>
  );
}

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/gif";

export function ImagePicker({ value, onChange, label = "Drop an image here" }: { value: MediaRef | null; onChange: (m: MediaRef | null) => void; label?: string }) {
  const { busy, run } = useUpload(false);
  if (value)
    return (
      <div className="flex items-center gap-4 rounded-xl border border-border p-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
          <Image src={value.url} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <p className="min-w-0 flex-1 truncate text-14">{value.filename}</p>
        <button type="button" onClick={() => onChange(null)} className={buttonClass({ variant: "ghost", size: "icon-sm" })} aria-label="Remove image">
          <Trash2 />
        </button>
      </div>
    );
  return <DropZone accept={IMAGE_ACCEPT} busy={busy} label={label} hint="PNG, JPEG, WebP or AVIF · up to 10 MB" camera onFiles={(f) => run(f, onChange)} />;
}

export function GalleryPicker({ value, onChange, max = 5 }: { value: MediaRef[]; onChange: (m: MediaRef[]) => void; max?: number }) {
  const { busy, run } = useUpload(false);
  const [drag, setDrag] = useState<number | null>(null);
  const list = useRef(value);
  useEffect(() => {
    list.current = value;
  }, [value]);
  function move(from: number, to: number) {
    const next = [...value];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  }
  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((m, i) => (
            <li
              key={m.id}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drag !== null && drag !== i && move(drag, i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface-2"
            >
              <Image src={m.url} alt="" fill sizes="200px" className="object-cover" />
              <span className="absolute top-1.5 left-1.5 flex size-7 cursor-grab items-center justify-center rounded-md bg-bg/80 text-muted" aria-hidden>
                <GripVertical className="size-4" />
              </span>
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => move(i, i - 1)} className="flex h-7 items-center rounded-md bg-bg/80 px-2 text-[0.75rem]" aria-label="Move earlier">
                    ←
                  </button>
                )}
                <button type="button" onClick={() => onChange(value.filter((x) => x.id !== m.id))} className="flex size-7 items-center justify-center rounded-md bg-bg/80 text-danger" aria-label="Remove image">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {value.length < max && (
        <DropZone
          accept={IMAGE_ACCEPT}
          multiple
          busy={busy}
          camera
          label={`Drop up to ${max - value.length} more image${max - value.length === 1 ? "" : "s"}`}
          hint="Drag to reorder after upload"
          onFiles={(files) => run(files.slice(0, max - value.length), (m) => onChange([...list.current, m]))}
        />
      )}
    </div>
  );
}

export function FilePicker({ value, onChange }: { value: MediaRef | null; onChange: (m: MediaRef | null) => void }) {
  const { busy, run } = useUpload(true);
  return (
    <div className="space-y-3">
      {value && (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-text">
            <FileArchive className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-14">{value.filename}</p>
            {value.bytes ? <p className="font-mono text-[0.75rem] text-subtle">{(value.bytes / 1024 / 1024).toFixed(2)} MB · private</p> : null}
          </div>
        </div>
      )}
      <DropZone accept=".zip,.pdf,.json,.txt,.md,.tar,.gz" busy={busy} label={value ? "Drop a file to replace it" : "Drop the product file here"} hint="zip, pdf, json, txt, md · up to 200 MB · stored privately" onFiles={(f) => run(f.slice(0, 1), onChange)} />
    </div>
  );
}
