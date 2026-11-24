import "server-only";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "./env";
import { randomToken } from "./crypto";

/**
 * File storage. Cloudinary in production (CLOUDINARY_URL); local disk in dev.
 * Keys look like `cld:<resource_type>:<public_id>` or `local:<relative path>`.
 * Private files are uploaded as authenticated assets and never get a public URL.
 */
export type Stored = { key: string; url: string; width?: number; height?: number; bytes: number };

const LOCAL_PUBLIC = path.join(process.cwd(), "public", "uploads");
const LOCAL_PRIVATE = path.join(process.cwd(), "storage", "private");
const SAFE_NAME = /[^a-zA-Z0-9._-]/g;

function ensureWritable() {
  if (!env.cloudinary && env.isProd) throw new Error("CLOUDINARY_URL is required in production (the server filesystem is read-only).");
}

export async function putFile(buf: Buffer, filename: string, mime: string, opts: { private: boolean }): Promise<Stored> {
  ensureWritable();
  const safe = filename.replace(SAFE_NAME, "_").slice(-80);
  if (env.cloudinary) {
    const isImage = mime.startsWith("image/") && !opts.private;
    const resourceType = isImage ? "image" : opts.private ? "raw" : "auto";
    const res = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: opts.private ? "inda/private" : "inda/public",
          resource_type: resourceType,
          type: opts.private ? "authenticated" : "upload",
          public_id: opts.private ? `${randomToken(12)}_${safe}` : undefined,
          use_filename: !opts.private,
          unique_filename: true,
        },
        (err, result) => (err || !result ? reject(err ?? new Error("Cloudinary upload returned nothing")) : resolve(result)),
      );
      stream.end(buf);
    });
    return {
      key: `cld:${res.resource_type}:${res.public_id}`,
      url: opts.private ? "" : res.secure_url,
      width: res.width,
      height: res.height,
      bytes: res.bytes,
    };
  }
  const dir = opts.private ? LOCAL_PRIVATE : LOCAL_PUBLIC;
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
  const name = `${randomToken(9)}_${safe}`;
  await writeFile(/*turbopackIgnore: true*/ path.join(dir, name), buf);
  return { key: `local:${opts.private ? "private" : "public"}/${name}`, url: opts.private ? "" : `/uploads/${name}`, bytes: buf.length };
}

function parseKey(key: string) {
  const [kind, a, ...rest] = key.split(":");
  if (kind === "cld") return { kind, resourceType: a, publicId: rest.join(":") } as const;
  if (kind === "local") {
    const [bucket, name] = a.split("/");
    if (!name || name.includes("..") || name !== path.basename(name)) throw new Error("Invalid storage key");
    return { kind, file: path.join(bucket === "private" ? LOCAL_PRIVATE : LOCAL_PUBLIC, name) } as const;
  }
  throw new Error(`Unknown storage key: ${key}`);
}

/** Short-lived signed URL for a private Cloudinary asset (default 5 minutes). */
export function signedUrl(key: string, ttlSeconds = 300) {
  const k = parseKey(key);
  if (k.kind !== "cld") return null;
  return cloudinary.utils.private_download_url(k.publicId, "", {
    resource_type: k.resourceType as "raw" | "image" | "video",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
    attachment: true,
  });
}

/** Read a stored file's bytes on the server (used to stamp PDFs / add licenses before delivery). */
export async function readStored(key: string): Promise<Buffer> {
  const k = parseKey(key);
  if (k.kind === "local") return readFile(/*turbopackIgnore: true*/ k.file);
  const url = signedUrl(key, 120)!;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch stored file (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function deleteStored(key: string) {
  const k = parseKey(key);
  if (k.kind === "local") {
    await unlink(/*turbopackIgnore: true*/ k.file).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== "ENOENT") throw e;
    });
    return;
  }
  const isPrivate = k.publicId.startsWith("inda/private/");
  await cloudinary.uploader.destroy(k.publicId, { resource_type: k.resourceType, type: isPrivate ? "authenticated" : "upload", invalidate: true });
}
