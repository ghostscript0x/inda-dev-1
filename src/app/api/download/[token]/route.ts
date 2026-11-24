import { headers } from "next/headers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { env } from "@/lib/env";
import { geoFromHeaders, clientIp } from "@/lib/request";
import { parseUA, recordServerEvent } from "@/lib/analytics";
import { rateLimit } from "@/lib/ratelimit";
import { readStored, signedUrl } from "@/lib/storage";
import { alertOwner } from "@/lib/notify";
import { MAX_DISTINCT_FINGERPRINTS } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STAMP_LIMIT_BYTES = 60 * 1024 * 1024; // larger files are delivered unmodified via signed URL

const deny = (msg: string, status = 403) => new Response(msg, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

function licenseText(o: { email: string; id: string; product: string; date: Date }) {
  return `LICENSE — ${o.product}
Licensed to: ${o.email}
Order: ${o.id}
Date: ${o.date.toISOString().slice(0, 10)}

You may use these files in your own projects and in projects you build for clients.
You may not resell, share, sublicense or redistribute these files, alone or as part
of another product or template.

Full license: ${env.siteUrl}/license
© Abdul-Quddus Inda (inda.dev)
`;
}

async function stampPdf(bytes: Buffer, line: string) {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const page of pdf.getPages()) {
    const { width } = page.getSize();
    const size = 7;
    const textWidth = font.widthOfTextAtSize(line, size);
    page.drawText(line, { x: Math.max(12, (width - textWidth) / 2), y: 10, size, font, color: rgb(0.45, 0.45, 0.48), opacity: 0.8 });
  }
  pdf.setSubject(line);
  return Buffer.from(await pdf.save());
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[\w-]{20,80}$/.test(token)) return deny("Invalid link", 404);
  const h = await headers();
  if (!(await rateLimit("download", clientIp(h), 30, "1 h"))) return deny("Too many requests", 429);

  const dl = await db.downloadToken.findUnique({ where: { tokenHash: sha256(token) }, include: { order: { include: { product: { include: { file: true } } } } } });
  if (!dl || dl.order.status !== "paid") return deny("Invalid link", 404);
  if (dl.lockedAt) return deny("This link is locked. Request a new one at /downloads.");
  if (dl.expiresAt < new Date() || dl.downloadsLeft <= 0) return deny("This link has expired. Request a new one at /downloads.", 410);
  const file = dl.order.product.file;
  if (!file) return deny("File unavailable. Please contact support.", 503);

  // Sharing detection: too many distinct countries or devices locks the link.
  const ua = h.get("user-agent") ?? "";
  const { device, browser, os } = parseUA(ua);
  const fingerprint = `${device}/${os}/${browser}`;
  const { country } = geoFromHeaders(h);
  const logs = await db.downloadLog.findMany({ where: { orderId: dl.orderId }, select: { country: true, device: true } });
  const countries = new Set([...logs.map((l) => l.country).filter(Boolean), country].filter(Boolean));
  const devices = new Set([...logs.map((l) => l.device), fingerprint].filter(Boolean));
  if (countries.size > MAX_DISTINCT_FINGERPRINTS || devices.size > MAX_DISTINCT_FINGERPRINTS) {
    await db.downloadToken.update({ where: { id: dl.id }, data: { lockedAt: new Date() } });
    await alertOwner("Download link locked", `Order ${dl.orderId} (${dl.order.product.title}, ${dl.order.email}) was used from ${countries.size} countries / ${devices.size} devices. The link is locked.`);
    return deny("This link was used from too many locations or devices and has been locked. Request a new one at /downloads.");
  }

  // Atomic decrement: concurrent requests cannot exceed the download limit.
  const claimed = await db.downloadToken.updateMany({ where: { id: dl.id, downloadsLeft: { gt: 0 }, lockedAt: null }, data: { downloadsLeft: { decrement: 1 } } });
  if (claimed.count === 0) return deny("This link has expired. Request a new one at /downloads.", 410);

  await db.downloadLog.create({ data: { orderId: dl.orderId, country, device: fingerprint, ua: ua.slice(0, 300) } });
  await recordServerEvent({ type: "download", path: `/products/${dl.order.product.slug}`, visitorId: dl.order.visitorId ?? "server", props: { productId: dl.order.productId, product: dl.order.product.title }, country });

  const order = { email: dl.order.email, id: dl.orderId, product: dl.order.product.title, date: dl.order.paidAt ?? dl.order.createdAt };
  const filename = file.filename.replace(/[^\w.\- ]/g, "_");
  const isPdf = file.mime === "application/pdf" || /\.pdf$/i.test(file.filename);
  const isZip = /zip/.test(file.mime) || /\.zip$/i.test(file.filename);

  if ((isPdf || isZip) && file.bytes <= STAMP_LIMIT_BYTES) {
    const original = await readStored(file.cloudinaryId);
    const body = isPdf
      ? await stampPdf(original, `Licensed to ${order.email} · Order ${order.id} · Not for redistribution`)
      : Buffer.from(await (await JSZip.loadAsync(original)).file(`LICENSE-${order.id}.txt`, licenseText(order)).generateAsync({ type: "uint8array", compression: "DEFLATE" }));
    return new Response(new Uint8Array(body), {
      headers: {
        "content-type": isPdf ? "application/pdf" : "application/zip",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "private, no-store",
        "x-robots-tag": "noindex",
      },
    });
  }

  // Other files: a signed Cloudinary URL valid for 5 minutes.
  const url = signedUrl(file.cloudinaryId, 300);
  if (url) return Response.redirect(url, 302);
  const bytes = await readStored(file.cloudinaryId);
  return new Response(new Uint8Array(bytes), {
    headers: { "content-type": file.mime || "application/octet-stream", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "private, no-store" },
  });
}
