import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/paystack";
import { fulfillPaidOrder } from "@/lib/store";
import { buttonClass } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ reference?: string; trxref?: string }> };

/**
 * Paystack redirects here after payment. The URL alone unlocks nothing: if the
 * webhook has not arrived yet, we verify the transaction server-side with Paystack.
 */
export default async function CheckoutSuccess({ searchParams }: Props) {
  const sp = await searchParams;
  const reference = (sp.reference ?? sp.trxref ?? "").slice(0, 100);
  const order = reference ? await db.order.findUnique({ where: { providerRef: reference }, include: { product: true } }) : null;

  let status = order?.status ?? "missing";
  if (order && status === "pending") {
    try {
      const trx = await verifyTransaction(reference);
      if (trx.status === "success") {
        await fulfillPaidOrder(reference, { amount: trx.amount, currency: trx.currency });
        status = (await db.order.findUniqueOrThrow({ where: { id: order.id } })).status;
      } else if (trx.status === "failed" || trx.status === "abandoned") {
        status = "failed";
      }
    } catch (err) {
      console.error("[checkout/success] verify failed", err);
    }
  }

  const view =
    status === "paid"
      ? { icon: CheckCircle2, tone: "text-accent-text", title: "Payment received", text: `Your download link for ${order!.product.title} is on its way to ${order!.email}. It works for 72 hours and up to 5 downloads.` }
      : status === "failed"
        ? { icon: XCircle, tone: "text-danger", title: "Payment didn’t go through", text: "No money was taken for this order. You can try again from the product page." }
        : status === "missing"
          ? { icon: XCircle, tone: "text-danger", title: "Order not found", text: "We couldn’t find this order. If you were charged, email us with your Paystack receipt and we’ll sort it out." }
          : { icon: Clock, tone: "text-warning", title: "Confirming your payment", text: "This can take a minute. You’ll get an email as soon as Paystack confirms it. Refresh this page to check again." };

  return (
    <div className="container-page max-w-xl pt-16 md:pt-24">
      <view.icon className={`size-9 ${view.tone}`} aria-hidden />
      <h1 className="mt-4 text-32 md:text-40">{view.title}</h1>
      <p className="mt-3 text-muted">{view.text}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {status === "failed" && order ? (
          <Link href={`/products/${order.product.slug}`} className={buttonClass()}>
            Try again
          </Link>
        ) : (
          <Link href="/downloads" className={buttonClass({ variant: "outline" })}>
            Didn’t get the email?
          </Link>
        )}
        <Link href="/products" className={buttonClass({ variant: "ghost" })}>
          Browse products
        </Link>
      </div>
      {order && <p className="mt-10 font-mono text-[0.75rem] text-subtle">Order {order.id}</p>}
    </div>
  );
}
