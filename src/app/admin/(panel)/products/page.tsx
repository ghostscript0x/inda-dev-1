import Link from "next/link";
import Image from "next/image";
import { Package, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { Cell, FilterLinks, ResponsiveTable, Row, Stat, statusLabel, statusTone } from "@/components/admin/ui";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { ListSearch } from "@/components/admin/list-search";
import { Badge, Empty } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { daysAgo, formatMoney, formatNumber } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/lib/content";

export const metadata = { title: "Products" };

type Search = { status?: string; q?: string };

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<Search> }) {
  const { status, q } = await searchParams;
  const since = daysAgo(30);
  const prev = daysAgo(60);

  const [products, counts, sales, downloads, recent30, prev30] = await Promise.all([
    db.product.findMany({
      where: {
        ...(status ? { status: status as "draft" } : {}),
        ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { cover: true },
    }),
    db.product.groupBy({ by: ["status"], _count: true }),
    db.order.groupBy({ by: ["productId"], where: { status: "paid" }, _count: true, _sum: { amount: true } }),
    db.$queryRaw<{ productId: string; n: bigint }[]>`SELECT o."productId", COUNT(d.id) AS n FROM "DownloadLog" d JOIN "Order" o ON o.id = d."orderId" GROUP BY o."productId"`,
    db.order.aggregate({ where: { status: "paid", paidAt: { gte: since } }, _count: true, _sum: { amount: true } }),
    db.order.aggregate({ where: { status: "paid", paidAt: { gte: prev, lt: since } }, _count: true, _sum: { amount: true } }),
  ]);

  const salesBy = new Map(sales.map((s) => [s.productId, { sales: s._count, revenue: s._sum.amount ?? 0 }]));
  const downloadsBy = new Map(downloads.map((d) => [d.productId, Number(d.n)]));
  const totalDownloads = downloads.reduce((n, d) => n + Number(d.n), 0);
  const delta = (a: number, b: number) => (b ? ((a - b) / b) * 100 : null);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const rev = recent30._sum.amount ?? 0;
  const prevRev = prev30._sum.amount ?? 0;

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything you sell. Upload the file, add details and a price, then publish."
        actions={
          <ButtonLink href="/admin/products/new" aria-keyshortcuts="n">
            <Plus aria-hidden /> New product
          </ButtonLink>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue · 30 days" value={formatMoney(rev)} delta={delta(rev, prevRev)} sub="vs previous 30" />
        <Stat label="Orders · 30 days" value={formatNumber(recent30._count)} delta={delta(recent30._count, prev30._count)} sub="paid" />
        <Stat label="Live products" value={count("published")} sub={`${count("draft")} drafts · ${count("hidden")} hidden`} />
        <Stat label="Downloads" value={formatNumber(totalDownloads)} sub="all time" />
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterLinks
          base="/admin/products"
          param="status"
          current={status}
          options={[
            { value: "", label: "All", count: counts.reduce((n, c) => n + c._count, 0) },
            { value: "published", label: "Live", count: count("published") },
            { value: "draft", label: "Drafts", count: count("draft") },
            { value: "hidden", label: "Hidden", count: count("hidden") },
          ]}
        />
        <ListSearch placeholder="Search products" />
      </div>

      {products.length === 0 ? (
        <Empty title={q || status ? "No products match" : "No products yet"} action={<ButtonLink href="/admin/products/new">New product</ButtonLink>}>
          {q || status ? "Try a different filter." : "Your first product takes about two minutes."}
        </Empty>
      ) : (
        <ResponsiveTable head={["Product", "Status", "Price", "Sales", "Revenue", "Downloads", ""]} align={["left", "left", "right", "right", "right", "right", "right"]}>
          {products.map((p) => {
            const s = salesBy.get(p.id);
            return (
              <Row key={p.id}>
                <Cell primary>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-2 text-subtle">
                      {p.cover?.url ? <Image src={p.cover.url} alt="" fill sizes="40px" className="object-cover" /> : <Package className="size-4" aria-hidden />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium hover:text-accent-text">{p.title}</span>
                      <span className="block truncate text-[0.75rem] text-subtle">
                        {PRODUCT_CATEGORIES[p.category]}
                        {p.featured ? " · featured" : ""}
                        {!p.fileId && <span className="text-warning"> · no file yet</span>}
                      </span>
                    </span>
                  </Link>
                </Cell>
                <Cell>
                  <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
                </Cell>
                <Cell className="font-mono text-[0.8125rem] whitespace-nowrap tabular-nums md:text-right">{p.isFree ? "Free" : formatMoney(p.priceNGN)}</Cell>
                <Cell label="Sales" className="font-mono text-[0.8125rem] tabular-nums md:text-right">
                  {s?.sales ?? 0}
                </Cell>
                <Cell label="Revenue" className="font-mono text-[0.8125rem] whitespace-nowrap tabular-nums md:text-right">
                  {s?.revenue ? formatMoney(s.revenue) : <span className="text-subtle">—</span>}
                </Cell>
                <Cell label="Downloads" className="font-mono text-[0.8125rem] tabular-nums md:text-right">
                  {downloadsBy.get(p.id) ?? 0}
                </Cell>
                <Cell className="text-right max-md:ml-auto">
                  <ProductRowActions id={p.id} slug={p.slug} status={p.status} priceNGN={p.priceNGN / 100} />
                </Cell>
              </Row>
            );
          })}
        </ResponsiveTable>
      )}
    </>
  );
}
