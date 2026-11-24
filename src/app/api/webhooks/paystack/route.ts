import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";
import { fulfillPaidOrder } from "@/lib/store";
import { alertOwner } from "@/lib/notify";
import { Prisma } from "@/generated/prisma/client";

type PaystackEvent = { event: string; data: { id?: number; reference?: string; amount?: number; currency?: string; status?: string; transaction_reference?: string } };

/**
 * Paystack webhook. Signature-checked (HMAC-SHA512 of the raw body), idempotent
 * per event, and the amount/currency must match the stored order.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-paystack-signature"))) return new Response("Invalid signature", { status: 401 });

  let evt: PaystackEvent;
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const ref = evt.data.reference ?? evt.data.transaction_reference;
  const eventKey = `paystack:${evt.event}:${evt.data.id ?? ref}`;
  try {
    await db.webhookEvent.create({ data: { id: eventKey, provider: "paystack" } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return new Response("Duplicate ignored", { status: 200 });
    throw e;
  }

  try {
    if (evt.event === "charge.success" && ref && evt.data.status === "success") {
      await fulfillPaidOrder(ref, { amount: Number(evt.data.amount), currency: String(evt.data.currency) });
    } else if (evt.event === "refund.processed" && ref) {
      const order = await db.order.findUnique({ where: { providerRef: ref } });
      if (order) {
        await db.order.update({ where: { id: order.id }, data: { status: "refunded", refundedAt: new Date() } });
        await db.downloadToken.updateMany({ where: { orderId: order.id }, data: { downloadsLeft: 0 } });
      }
    } else if (evt.event === "charge.dispute.create" && ref) {
      await alertOwner("Paystack dispute opened", `A dispute was opened for reference ${ref}. Open the order in the admin to see the evidence log.`);
    }
  } catch (err) {
    // Let Paystack retry: remove the idempotency marker and return 500.
    await db.webhookEvent.delete({ where: { id: eventKey } }).catch(() => undefined);
    console.error("[webhook:paystack] processing failed", err);
    return new Response("Processing failed", { status: 500 });
  }
  return new Response("ok", { status: 200 });
}
