import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { ProductEditor, type ProductEditorValue } from "@/components/admin/product-editor";
import type { MediaRef } from "@/components/admin/uploader";

export const metadata = { title: "Edit product" };

const EMPTY: ProductEditorValue = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  whatsInside: "",
  audience: "",
  faqs: [],
  priceNGN: "",
  isFree: false,
  category: "workflows",
  images: [],
  file: null,
  videoUrl: "",
  featured: false,
  status: "draft",
  seoTitle: "",
  seoDescription: "",
};

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const product = isNew ? null : await db.product.findUnique({ where: { id }, include: { seo: true } });
  if (!isNew && !product) notFound();

  const revisions = product ? await db.revision.findMany({ where: { entity: "product", entityId: product.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, createdAt: true } }) : [];

  // Every media item this product has ever referenced, so restoring an old version can show its images.
  const revData = product ? await db.revision.findMany({ where: { entity: "product", entityId: product.id }, select: { data: true }, take: 50 }) : [];
  const ids = new Set<string>();
  if (product) [product.coverId, product.fileId, ...product.galleryIds].forEach((x) => x && ids.add(x));
  for (const r of revData) {
    const d = r.data as { coverId?: string; fileId?: string; galleryIds?: string[] };
    [d.coverId, d.fileId, ...(d.galleryIds ?? [])].forEach((x) => x && ids.add(x));
  }
  const rows = ids.size ? await db.media.findMany({ where: { id: { in: [...ids] } } }) : [];
  const media: Record<string, MediaRef> = Object.fromEntries(rows.map((m) => [m.id, { id: m.id, url: m.url, filename: m.filename, bytes: m.bytes }]));

  const initial: ProductEditorValue = product
    ? {
        id: product.id,
        title: product.title,
        slug: product.slug,
        summary: product.summary,
        description: product.description,
        whatsInside: product.whatsInside.join("\n"),
        audience: product.audience,
        faqs: product.faqs as { q: string; a: string }[],
        priceNGN: String(product.priceNGN / 100),
        isFree: product.isFree,
        category: product.category,
        images: [product.coverId, ...product.galleryIds].filter((x): x is string => Boolean(x && media[x])).map((x) => media[x]),
        file: product.fileId ? (media[product.fileId] ?? null) : null,
        videoUrl: product.videoUrl ?? "",
        featured: product.featured,
        status: product.status,
        seoTitle: product.seo?.title ?? "",
        seoDescription: product.seo?.description ?? "",
      }
    : EMPTY;

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-14 text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Products
      </Link>
      <PageHeader title={isNew ? "New product" : product!.title} description={isNew ? "Upload the file, add images and details, set a price, then publish." : undefined} />
      <ProductEditor initial={initial} revisions={revisions.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString() }))} media={media} />
    </>
  );
}
