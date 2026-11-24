import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Download, FileDown, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { buttonClass } from "@/components/ui/button";
import { ReviewForm } from "@/components/store/review-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your download", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };

function Problem({ title, text }: { title: string; text: string }) {
  return (
    <div className="container-page max-w-xl pt-16 md:pt-24">
      <ShieldAlert className="size-8 text-warning" aria-hidden />
      <h1 className="mt-4 text-32">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      <Link href="/downloads" className={buttonClass({}, "mt-8")}>
        Send me a new link
      </Link>
    </div>
  );
}

export default async function DownloadPage({ params }: Props) {
  const { token } = await params;
  if (!/^[\w-]{20,80}$/.test(token)) return <Problem title="Link not found" text="This download link is not valid. Enter your email and we’ll send a fresh one." />;
  const dl = await db.downloadToken.findUnique({ where: { tokenHash: sha256(token) }, include: { order: { include: { product: true, review: true } } } });
  if (!dl || dl.order.status !== "paid") return <Problem title="Link not found" text="This download link is not valid. Enter your email and we’ll send a fresh one." />;
  if (dl.lockedAt) return <Problem title="Link locked" text="This link was used from too many locations or devices, so it was locked to protect your purchase. Request a new one with your email, or reply to your receipt if you need help." />;
  if (dl.expiresAt < new Date() || dl.downloadsLeft <= 0) return <Problem title="Link expired" text="Links work for 72 hours and up to 5 downloads. Enter your email and we’ll send a fresh one." />;

  const { order } = dl;
  return (
    <div className="container-page max-w-2xl pt-16 md:pt-24">
      <p className="eyebrow">Your download</p>
      <h1 className="mt-3 text-32 md:text-40">{order.product.title}</h1>
      <p className="mt-3 text-muted">Thanks for your purchase. Your file includes a license with your email and order number.</p>
      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <a href={`/api/download/${token}`} className={buttonClass({ size: "lg" }, "w-full sm:w-auto")} data-track="download_click" rel="nofollow">
          <Download aria-hidden /> Download file
        </a>
        <dl className="mt-6 grid gap-4 text-14 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 text-muted">
            <FileDown className="size-4" aria-hidden />
            <dt className="sr-only">Downloads left</dt>
            <dd>
              {dl.downloadsLeft} download{dl.downloadsLeft === 1 ? "" : "s"} left
            </dd>
          </div>
          <div className="flex items-center gap-2.5 text-muted">
            <Clock className="size-4" aria-hidden />
            <dt className="sr-only">Expires</dt>
            <dd>Expires {formatDate(dl.expiresAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</dd>
          </div>
        </dl>
        <p className="mt-4 font-mono text-[0.75rem] text-subtle">Order {order.id}</p>
      </div>
      <section className="mt-12">
        <h2 className="text-24">Leave a review</h2>
        {order.review ? (
          <p className="mt-3 text-muted">{order.review.approved ? "Thanks, your review is live." : "Thanks, your review is waiting for approval."}</p>
        ) : (
          <ReviewForm token={token} />
        )}
      </section>
    </div>
  );
}
