import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { emailSchema, fail, json, readJson, sameOrigin } from "@/lib/api";
import { rateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { clientIp, geoFromHeaders } from "@/lib/request";
import { CheckoutError, findValidCoupon, priceFor } from "@/lib/store";
import { initializeTransaction } from "@/lib/paystack";
import { randomToken, sha256 } from "@/lib/crypto";
import { recordServerEvent } from "@/lib/analytics";
import { emailButton, emailLayout, escapeHtml, sendEmail } from "@/lib/notify";

const schema = z.object({
  productId: z.string().min(1).max(40),
  email: emailSchema,
  coupon: z.string().trim().max(40).optional(),
  termsAccepted: z.literal(true, { message: "Please accept the Terms, Refund policy and License." }),
  turnstileToken: z.string().max(4096).nullish(),
  visitorId: z.string().max(64).nullish(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  const h = await headers();
  const ip = clientIp(h);
  if (!(await rateLimit("checkout", ip, 10, "10 m"))) return fail("Too many attempts. Please wait a few minutes.", 429);

  const parsed = await readJson(req, schema);
  if ("res" in parsed) return parsed.res;
  const input = parsed.data;

  if (!(await verifyTurnstile(input.turnstileToken, ip))) return fail("Spam check failed. Please refresh and try again.", 400);

  // Price, availability and file come from the database only.
  const product = await db.product.findUnique({ where: { id: input.productId } });
  if (!product || product.status !== "published") return fail("This product is not available.", 404);
  if (!product.fileId) return fail("This product is being updated. Please try again shortly.", 409);

  try {
    const coupon = input.coupon && !product.isFree ? await findValidCoupon(input.coupon, input.email) : null;
    const amount = priceFor(product, coupon);
    const geo = geoFromHeaders(h);
    const reference = `inda_${randomToken(12)}`;
    const base = {
      email: input.email,
      productId: product.id,
      currency: "NGN",
      providerRef: reference,
      couponId: coupon?.id,
      termsAcceptedAt: new Date(),
      visitorId: input.visitorId ?? null,
      country: geo.country,
    } as const;

    await recordServerEvent({ type: "checkout_start", path: `/products/${product.slug}`, visitorId: input.visitorId ?? "server", props: { productId: product.id, product: product.title }, country: geo.country });

    // Free (or 100%-off): confirm the email address instead of taking a payment.
    if (amount === 0) {
      const confirm = randomToken(24);
      await db.order.create({ data: { ...base, amount: 0, provider: "free", status: "awaiting_confirmation", confirmHash: sha256(confirm) } });
      const link = `${env.siteUrl}/checkout/confirm?t=${confirm}`;
      await sendEmail({
        to: input.email,
        subject: `Confirm your email to get ${product.title}`,
        text: `Confirm your email to get ${product.title}:\n${link}\n\nIf you didn't request this, ignore this email.`,
        html: emailLayout("Confirm your email", `<p>Click below to confirm your email and get <strong>${escapeHtml(product.title)}</strong>.</p>${emailButton(link, "Confirm and download")}<p style="color:#52525B;font-size:13px">If you didn't request this, ignore this email.</p>`),
      });
      return json({ confirm: true });
    }

    await db.order.create({ data: { ...base, amount, provider: "paystack", status: "pending" } });
    const trx = await initializeTransaction({
      email: input.email,
      amount,
      reference,
      callbackUrl: `${env.siteUrl}/checkout/success`,
      metadata: { productId: product.id, product: product.title, custom_fields: [{ display_name: "Product", variable_name: "product", value: product.title }] },
    });
    return json({ url: trx.authorization_url });
  } catch (err) {
    if (err instanceof CheckoutError) return fail(err.message, 400, { fields: { coupon: err.message } });
    console.error("[checkout] failed", err);
    return fail("Checkout is unavailable right now. Please try again in a moment.", 502);
  }
}
