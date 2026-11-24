import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { Cell, FilterLinks, ResponsiveTable, Row, statusLabel, statusTone } from "@/components/admin/ui";
import { ListSearch } from "@/components/admin/list-search";
import { Badge, Empty } from "@/components/ui/misc";
import { formatDate, formatMoney } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";

export const metadata = { title: "Orders" };

const PAGE = 50;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const { status, q, page } = await searchParams;
  const p = Math.max(1, Number(page) || 1);
  const where = {
    ...(status ? { status: status as OrderStatus } : {}),
    ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { providerRef: { contains: q } }, { id: q }] } : {}),
  };
  const [orders, counts, total] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (p - 1) * PAGE, include: { product: { select: { title: true } }, _count: { select: { downloads: true } } } }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.count({ where }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader title="Orders" description="Every purchase, with its payment, email and download history." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterLinks
          base="/admin/orders"
          param="status"
          current={status}
          options={[
            { value: "", label: "All" },
            { value: "paid", label: "Paid", count: c("paid") },
            { value: "pending", label: "Pending", count: c("pending") },
            { value: "awaiting_confirmation", label: "Free, unconfirmed", count: c("awaiting_confirmation") },
            { value: "failed", label: "Failed", count: c("failed") },
            { value: "refunded", label: "Refunded", count: c("refunded") },
          ]}
        />
        <ListSearch placeholder="Email, reference or ID" />
      </div>
      {orders.length === 0 ? (
        <Empty title="No orders here yet" />
      ) : (
        <ResponsiveTable head={["Order", "Product", "Amount", "Status", "Downloads", "Date"]}>
          {orders.map((o) => (
            <Row key={o.id}>
              <Cell primary>
                <Link href={`/admin/orders/${o.id}`} className="block hover:text-accent-text">
                  <span className="block truncate font-medium">{o.email}</span>
                  <span className="block font-mono text-[0.75rem] text-subtle">{o.providerRef}</span>
                </Link>
              </Cell>
              <Cell className="max-w-56 truncate">{o.product.title}</Cell>
              <Cell className="font-mono text-[0.8125rem]">{o.amount ? formatMoney(o.amount) : "Free"}</Cell>
              <Cell>
                <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
              </Cell>
              <Cell label="Downloads" className="font-mono">
                {o._count.downloads}
              </Cell>
              <Cell className="font-mono text-[0.75rem] whitespace-nowrap text-muted">{formatDate(o.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Cell>
            </Row>
          ))}
        </ResponsiveTable>
      )}
      {total > PAGE && (
        <div className="mt-4 flex items-center justify-between text-14 text-muted">
          <span>
            Page {p} of {Math.ceil(total / PAGE)}
          </span>
          <div className="flex gap-3">
            {p > 1 && (
              <Link className="link" href={`/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), page: String(p - 1) })}`}>
                Previous
              </Link>
            )}
            {p * PAGE < total && (
              <Link className="link" href={`/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), page: String(p + 1) })}`}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
