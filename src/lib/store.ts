import "server-only";
import { db } from "./db";
import { env } from "./env";
import { randomToken, sha256 } from "./crypto";
import { alertOwner, emailButton, emailLayout, escapeHtml, sendEmail } from "./notify";
import { formatMoney } from "./utils";
import { recordServerEvent } from "./analytics";
import type { Coupon, Product } from "@/generated/prisma/client";

export const TOKEN_TTL_MS = 72 * 60 * 60 * 1000;
export const TOKEN_MAX_DOWNLOADS = 5;
export const MAX_DISTINCT_FINGERPRINTS = 3; // countries or devices before a link locks

export class CheckoutError extends Error {}

export async function findValidCoupon(code: string, email: string) {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) throw new CheckoutError("That coupon code is not valid.");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new CheckoutError("That coupon has expired.");
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) throw new CheckoutError("That coupon has been fully used.");
  const used = await db.order.count({ where: { couponId: coupon.id, email, status: "paid" } });
  if (used > 0) throw new CheckoutError("You have already used this coupon.");
  return coupon;
}

/** Price always comes from the database, never the browser. */
export function priceFor(product: Pick<Product, "priceNGN" | "isFree">, coupon?: Coupon | null) {
  if (product.isFree) return 0;
  const base = product.priceNGN;
  if (!coupon) return base;
  const discounted = Math.round((base * (100 - Math.min(100, Math.max(0, coupon.percentOff)))) / 100);
  return Math.max(0, discounted);
}

export async function issueDownloadToken(orderId: string) {
  const token = randomToken(32);
  await db.downloadToken.create({
    data: { orderId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS), downloadsLeft: TOKEN_MAX_DOWNLOADS },
  });
  return token;
}

export async function sendDownloadEmail(orderId: string, token: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { product: true } });
  const link = `${env.siteUrl}/downloads/${token}`;
  const paid = order.amount > 0 ? ` Paid: ${formatMoney(order.amount)}.` : "";
  await sendEmail({
    to: order.email,
    subject: `Your download: ${order.product.title}`,
    text: `Thanks for getting ${order.product.title}.${paid}\n\nDownload: ${link}\n\nThe link works for 72 hours and up to 5 downloads. Lost it? Use ${env.siteUrl}/downloads to get a new one.\n\nOrder: ${order.id}`,
    html: emailLayout(
      `Your download is ready`,
      `<p>Thanks for getting <strong>${escapeHtml(order.product.title)}</strong>.${escapeHtml(paid)}</p>${emailButton(link, "Download")}<p style="color:#52525B;font-size:13px">The link works for 72 hours and up to 5 downloads. Lost it? Visit <a href="${env.siteUrl}/downloads">${env.siteUrl.replace(/^https?:\/\//, "")}/downloads</a> to get a new one.<br>Order: ${order.id}</p>`,
    ),
  });
  await db.order.update({ where: { id: orderId }, data: { emailSentAt: new Date() } });
}

/**
 * Mark an order paid after the provider confirmed it (webhook or server-side verify).
 * Idempotent: safe to call any number of times for the same reference.
 * Rejects payments whose amount or currency does not match the order.
 */
export async function fulfillPaidOrder(reference: string, paid: { amount: number; currency: string }) {
  const order = await db.order.findUnique({ where: { providerRef: reference }, include: { product: true } });
  if (!order) throw new Error(`No order for reference ${reference}`);
  if (order.status === "paid" || order.status === "refunded") return { order, fresh: false };

  if (paid.amount !== order.amount || paid.currency !== order.currency) {
    await db.order.update({ where: { id: order.id }, data: { status: "failed" } });
    await alertOwner(
      "Payment mismatch rejected",
      `Order ${order.id} (${order.product.title}) expected ${order.amount} ${order.currency} but provider reported ${paid.amount} ${paid.currency}. No download was issued.`,
    );
    return { order, fresh: false };
  }

  // Only one caller wins the pending → paid transition.
  const claimed = await db.order.updateMany({ where: { id: order.id, status: { in: ["pending", "awaiting_confirmation"] } }, data: { status: "paid", paidAt: new Date() } });
  if (claimed.count === 0) return { order, fresh: false };

  if (order.couponId) await db.coupon.update({ where: { id: order.couponId }, data: { uses: { increment: 1 } } });
  const token = await issueDownloadToken(order.id);
  await sendDownloadEmail(order.id, token);
  await recordServerEvent({
    type: "purchase",
    path: `/products/${order.product.slug}`,
    visitorId: order.visitorId ?? "server",
    props: { productId: order.productId, product: order.product.title, currency: order.currency, source: order.source, free: order.amount === 0 },
    value: order.amount,
    country: order.country,
  });
  if (order.amount > 0) await alertOwner("New sale", `${order.product.title} · ${formatMoney(order.amount)} · ${order.email}`);
  return { order, fresh: true };
}
