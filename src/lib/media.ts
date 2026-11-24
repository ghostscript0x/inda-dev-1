import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { db } from "./db";
import { putFile } from "./storage";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_BYTES = 200 * 1024 * 1024;

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
const FILE_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/pdf",
  "application/json",
  "text/plain",
  "text/markdown",
  "application/octet-stream",
  "application/x-tar",
  "application/gzip",
];

export function checkUpload(mime: string, bytes: number, isPrivate: boolean) {
  if (!isPrivate) {
    if (!IMAGE_TYPES.includes(mime)) return "Images must be PNG, JPEG, WebP, AVIF or GIF.";
    if (bytes > MAX_IMAGE_BYTES) return "Images must be under 10 MB.";
  } else {
    if (!FILE_TYPES.includes(mime) && !IMAGE_TYPES.includes(mime)) return "Unsupported file type. Use zip, pdf, json, txt, md, tar or gz.";
    if (bytes > MAX_FILE_BYTES) return "Files must be under 200 MB.";
  }
  return null;
}

export async function storeUpload(file: File, opts: { private: boolean; alt?: string }) {
  const err = checkUpload(file.type || "application/octet-stream", file.size, opts.private);
  if (err) throw new Error(err);
  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await putFile(buf, file.name, file.type, { private: opts.private });
  return db.media.create({
    data: {
      cloudinaryId: stored.key,
      url: stored.url,
      filename: file.name.slice(0, 200),
      mime: file.type || "application/octet-stream",
      bytes: stored.bytes,
      width: stored.width ?? null,
      height: stored.height ?? null,
      alt: opts.alt?.slice(0, 300) ?? "",
      private: opts.private,
    },
  });
}

/** Signed params so the browser can upload straight to Cloudinary (no server body-size limit). */
export function signDirectUpload(isPrivate: boolean) {
  const cfg = cloudinary.config();
  if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) throw new Error("Cloudinary is not configured.");
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp, folder: isPrivate ? "inda/private" : "inda/public", type: isPrivate ? "authenticated" : "upload" };
  const signature = cloudinary.utils.api_sign_request(params, cfg.api_secret);
  const resourceType = isPrivate ? "raw" : "image";
  return { ...params, signature, apiKey: cfg.api_key, uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.cloud_name}/${resourceType}/upload`, resourceType };
}

/** Register a direct upload after confirming with Cloudinary's Admin API that the asset really exists. */
export async function registerDirectUpload(input: { publicId: string; resourceType: "image" | "raw"; private: boolean; filename: string; mime: string; alt?: string }) {
  const expectedFolder = input.private ? "inda/private/" : "inda/public/";
  if (!input.publicId.startsWith(expectedFolder)) throw new Error("Unexpected upload location.");
  const res = (await cloudinary.api.resource(input.publicId, { resource_type: input.resourceType, type: input.private ? "authenticated" : "upload" })) as {
    public_id: string;
    resource_type: string;
    secure_url: string;
    bytes: number;
    width?: number;
    height?: number;
  };
  const err = checkUpload(input.mime || "application/octet-stream", res.bytes, input.private);
  if (err) {
    await cloudinary.uploader.destroy(res.public_id, { resource_type: res.resource_type, type: input.private ? "authenticated" : "upload" });
    throw new Error(err);
  }
  return db.media.create({
    data: {
      cloudinaryId: `cld:${res.resource_type}:${res.public_id}`,
      url: input.private ? "" : res.secure_url,
      filename: input.filename.slice(0, 200),
      mime: input.mime || "application/octet-stream",
      bytes: res.bytes,
      width: res.width ?? null,
      height: res.height ?? null,
      alt: input.alt?.slice(0, 300) ?? "",
      private: input.private,
    },
  });
}
