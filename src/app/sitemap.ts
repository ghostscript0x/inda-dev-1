import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const revalidate = 3600;

/** Built from the database, so new projects and products appear automatically. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, products, legal, settings] = await Promise.all([
    db.project.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.product.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
    db.legalDoc.findMany({ select: { slug: true, updatedAt: true } }),
    db.siteSettings.findUnique({ where: { id: 1 }, select: { updatedAt: true } }),
  ]);
  const now = settings?.updatedAt ?? new Date();
  return [
    { url: `${site}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    ...projects.map((p) => ({ url: `${site}/work/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...legal.map((l) => ({ url: `${site}/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
