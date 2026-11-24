"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/data";
import { issueDownloadToken, sendDownloadEmail } from "@/lib/store";
import { adminAction, publish } from "./common";

export async function resendDownload(orderId: string) {
  return adminAction("order.resend", async () => {
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status !== "paid") throw new Error("Only paid orders get download links.");
    await db.downloadToken.updateMany({ where: { orderId }, data: { downloadsLeft: 0 } });
    const token = await issueDownloadToken(orderId);
    await sendDownloadEmail(orderId, token);
    return { target: orderId, message: `New link sent to ${order.email}.` };
  });
}

export async function unlockDownloads(orderId: string) {
  return adminAction("order.unlock", async () => {
    await db.downloadToken.updateMany({ where: { orderId }, data: { lockedAt: null } });
    return { target: orderId, message: "Links unlocked." };
  });
}

/** Records a refund made in the Paystack dashboard and revokes downloads. */
export async function markRefunded(orderId: string) {
  return adminAction("order.refund", async () => {
    await db.order.update({ where: { id: orderId }, data: { status: "refunded", refundedAt: new Date() } });
    await db.downloadToken.updateMany({ where: { orderId }, data: { downloadsLeft: 0 } });
    return { target: orderId, message: "Marked refunded. Downloads revoked." };
  });
}

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,40}$/, "Use 3–40 letters, numbers, - or _."),
  percentOff: z.number().int().min(1).max(100),
  maxUses: z.number().int().min(1).nullable(),
  expiresAt: z.string().nullable(),
});

export async function createCoupon(input: z.input<typeof couponSchema>) {
  return adminAction("coupon.create", async () => {
    const c = couponSchema.parse(input);
    const coupon = await db.coupon.create({ data: { code: c.code, percentOff: c.percentOff, maxUses: c.maxUses, expiresAt: c.expiresAt ? new Date(c.expiresAt) : null } });
    return { target: coupon.id, message: `Coupon ${coupon.code} created.` };
  });
}

export async function toggleCoupon(id: string, active: boolean) {
  return adminAction("coupon.toggle", async () => {
    await db.coupon.update({ where: { id }, data: { active } });
    return { target: id, meta: { active }, message: active ? "Coupon enabled." : "Coupon disabled." };
  });
}

export async function moderateReview(id: string, approve: boolean) {
  return adminAction("review.moderate", async () => {
    if (approve) await db.review.update({ where: { id }, data: { approved: true } });
    else await db.review.delete({ where: { id } });
    publish(TAGS.reviews, TAGS.products);
    return { target: id, meta: { approve }, message: approve ? "Review approved." : "Review removed." };
  });
}
