import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, RotateCcw, Unlock } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { Panel } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { Badge } from "@/components/ui/misc";
import { statusLabel, statusTone } from "@/components/admin/ui";
import { formatDate, formatMoney } from "@/lib/utils";
import { markRefunded, resendDownload, unlockDownloads } from "@/app/admin/actions/store";

export const metadata = { title: "Order" };

const dt = (d: Date | null | undefined) => (d ? formatDate(d, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—");

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { product: true, coupon: true, tokens: { orderBy: { createdAt: "desc" } }, downloads: { orderBy: { ts: "desc" } } } });
  if (!order) notFound();
  const locked = order.tokens.some((t) => t.lockedAt);

  const facts: [string, React.ReactNode][] = [
    ["Order ID", <span key="id" className="font-mono">{order.id}</span>],
    ["Email", order.email],
    ["Product", <Link key="p" className="link" href={`/admin/products/${order.productId}`}>{order.product.title}</Link>],
    ["Amount", order.amount ? formatMoney(order.amount) : "Free"],
    ["Provider", `${order.provider} · ${order.providerRef}`],
    ["Coupon", order.coupon ? `${order.coupon.code} (−${order.coupon.percentOff}%)` : "—"],
    ["Created", dt(order.createdAt)],
    ["Paid", dt(order.paidAt)],
    ["Terms, refund policy & license accepted", dt(order.termsAcceptedAt)],
    ["Download email sent", dt(order.emailSentAt)],
    ["Country at checkout", order.country ?? "—"],
    ["Refunded", dt(order.refundedAt)],
  ];

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-14 text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Orders
      </Link>
      <PageHeader
        title={order.email}
        description={`${order.product.title} · ${order.amount ? formatMoney(order.amount) : "Free"}`}
        actions={
          order.status === "paid" ? (
            <>
              <ActionButton variant="outline" action={resendDownload.bind(null, order.id)}>
                <Mail aria-hidden /> Resend link
              </ActionButton>
              {locked && (
                <ActionButton variant="outline" action={unlockDownloads.bind(null, order.id)}>
                  <Unlock aria-hidden /> Unlock
                </ActionButton>
              )}
              <ActionButton variant="danger" action={markRefunded.bind(null, order.id)} confirmText="Mark as refunded and revoke downloads? Process the actual refund in your Paystack dashboard.">
                <RotateCcw aria-hidden /> Mark refunded
              </ActionButton>
            </>
          ) : undefined
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Evidence" action={<Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>}>
          <dl className="divide-y divide-border text-14">
            {facts.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-6">
                <dt className="text-muted">{k}</dt>
                <dd className="break-all sm:text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <div className="space-y-6">
          <Panel title={`Download log (${order.downloads.length})`}>
            {order.downloads.length === 0 ? (
              <p className="text-14 text-muted">No downloads yet.</p>
            ) : (
              <ul className="divide-y divide-border text-[0.8125rem]">
                {order.downloads.map((d) => (
                  <li key={d.id} className="flex flex-col gap-0.5 py-2.5">
                    <span className="font-mono">{dt(d.ts)}</span>
                    <span className="text-muted">
                      {d.country ?? "Unknown country"} · {d.device ?? "unknown device"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Download links">
            {order.tokens.length === 0 ? (
              <p className="text-14 text-muted">No links issued.</p>
            ) : (
              <ul className="divide-y divide-border text-[0.8125rem]">
                {order.tokens.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="font-mono text-muted">Issued {dt(t.createdAt)}</span>
                    <span>{t.lockedAt ? <Badge tone="danger">locked</Badge> : t.expiresAt < new Date() || t.downloadsLeft <= 0 ? <Badge tone="muted">expired</Badge> : <Badge tone="accent">{t.downloadsLeft} left</Badge>}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
