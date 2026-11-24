import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { fulfillPaidOrder } from "@/lib/store";
import { daysAgo } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confirm email", robots: { index: false, follow: false } };

const CONFIRM_TTL_DAYS = 2;

/** Free products: the buyer confirms their email before the download is issued. */
export default async function ConfirmFreeOrder({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const order = t && /^[\w-]{20,80}$/.test(t) ? await db.order.findUnique({ where: { confirmHash: sha256(t) }, include: { product: true } }) : null;
  const valid = order && (order.status === "paid" || (order.status === "awaiting_confirmation" && order.createdAt > daysAgo(CONFIRM_TTL_DAYS)));

  if (order && valid && order.status === "awaiting_confirmation") await fulfillPaidOrder(order.providerRef, { amount: 0, currency: order.currency });

  return (
    <div className="container-page max-w-xl pt-16 md:pt-24">
      {valid ? <CheckCircle2 className="size-9 text-accent-text" aria-hidden /> : <XCircle className="size-9 text-danger" aria-hidden />}
      <h1 className="mt-4 text-32 md:text-40">{valid ? "Email confirmed" : "Link expired"}</h1>
      <p className="mt-3 text-muted">{valid ? `Your download link for ${order!.product.title} is on its way to ${order!.email}.` : "This confirmation link is invalid or older than 48 hours. Request the product again from its page."}</p>
      <Link href="/products" className={buttonClass({ variant: "outline" }, "mt-8")}>
        Browse products
      </Link>
    </div>
  );
}
