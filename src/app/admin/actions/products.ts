"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { faqSchema } from "@/lib/content";
import { TAGS } from "@/lib/data";
import { uniqueSlug } from "@/lib/slug";
import { adminAction, publish, saveRevision } from "./common";

const money = z.number().min(0).max(100_000_000); // major units from the form

const productSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Add a name.").max(120),
  summary: z.string().trim().min(5, "Add a one-line summary.").max(200),
  description: z.string().trim().max(10000),
  whatsInside: z.array(z.string().trim().min(1).max(200)).max(30),
  audience: z.string().trim().max(1000),
  faqs: faqSchema,
  priceNGN: money,
  isFree: z.boolean(),
  category: z.enum(["templates", "workflows", "starters", "guides", "scripts"]),
  coverId: z.string().nullable(),
  galleryIds: z.array(z.string()).max(5),
  videoUrl: z.string().trim().url().max(300).or(z.literal("")).nullable(),
  fileId: z.string().nullable(),
  featured: z.boolean(),
  status: z.enum(["draft", "published", "hidden"]),
  seoTitle: z.string().trim().max(60).optional(),
  seoDescription: z.string().trim().max(155).optional(),
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput) {
  return adminAction<{ id: string; slug: string }>("product.save", async (userId) => {
    const p = productSchema.parse(input);
    if (p.status === "published" && !p.fileId) throw new Error("Upload the product file before publishing.");
    if (p.status === "published" && !p.isFree && p.priceNGN <= 0) throw new Error("Set a price (or mark it free) before publishing.");
    // The link is generated from the name. It follows the name while the product is a draft,
    // then stays fixed once it has gone live so links people shared keep working.
    const existing = p.id ? await db.product.findUnique({ where: { id: p.id }, select: { slug: true, status: true } }) : null;
    const slug =
      existing && existing.status !== "draft"
        ? existing.slug
        : await uniqueSlug(p.title, async (s) => Boolean(await db.product.findFirst({ where: { slug: s, ...(p.id ? { NOT: { id: p.id } } : {}) }, select: { id: true } })));
    const data = {
      title: p.title,
      slug,
      summary: p.summary,
      description: p.description,
      whatsInside: p.whatsInside,
      audience: p.audience,
      faqs: p.faqs,
      priceNGN: p.isFree ? 0 : Math.round(p.priceNGN * 100),
      isFree: p.isFree,
      category: p.category,
      coverId: p.coverId,
      galleryIds: p.galleryIds,
      videoUrl: p.videoUrl || null,
      fileId: p.fileId,
      featured: p.featured,
      status: p.status,
    };
    const product = p.id ? await db.product.update({ where: { id: p.id }, data }) : await db.product.create({ data });
    await db.seoMeta.upsert({
      where: { productId: product.id },
      create: { productId: product.id, title: p.seoTitle || null, description: p.seoDescription || null },
      update: { title: p.seoTitle || null, description: p.seoDescription || null },
    });
    await saveRevision("product", product.id, data, userId);
    publish(TAGS.products);
    return { target: product.id, data: { id: product.id, slug: product.slug }, message: p.status === "published" ? "Published. Live within seconds." : "Saved." };
  });
}

export async function setProductStatus(id: string, status: "draft" | "published" | "hidden") {
  return adminAction("product.status", async () => {
    const p = await db.product.findUniqueOrThrow({ where: { id } });
    if (status === "published" && !p.fileId) throw new Error("Upload the product file before publishing.");
    await db.product.update({ where: { id }, data: { status } });
    publish(TAGS.products);
    return { target: id, meta: { status }, message: status === "hidden" ? "Hidden from the store." : status === "published" ? "Published." : "Moved to drafts." };
  });
}

export async function duplicateProduct(id: string) {
  return adminAction<{ id: string }>("product.duplicate", async () => {
    const p = await db.product.findUniqueOrThrow({ where: { id } });
    const { id: _id, createdAt: _c, updatedAt: _u, faqs, ...rest } = p;
    void _id;
    void _c;
    void _u;
    let slug = `${p.slug}-copy`;
    for (let i = 2; await db.product.findUnique({ where: { slug } }); i++) slug = `${p.slug}-copy-${i}`;
    const copy = await db.product.create({ data: { ...rest, faqs: faqs as object, slug, title: `${p.title} (copy)`, status: "draft", featured: false } });
    return { target: copy.id, data: { id: copy.id }, message: "Duplicated as a draft." };
  });
}

export async function updatePrice(id: string, priceNGN: number) {
  return adminAction("product.price", async () => {
    const parsed = z.object({ ngn: money }).parse({ ngn: priceNGN });
    await db.product.update({ where: { id }, data: { priceNGN: Math.round(parsed.ngn * 100), isFree: parsed.ngn === 0 } });
    publish(TAGS.products);
    return { target: id, meta: parsed, message: "Price updated." };
  });
}

export async function deleteProduct(id: string) {
  return adminAction("product.delete", async () => {
    const orders = await db.order.count({ where: { productId: id } });
    if (orders > 0) throw new Error("This product has orders, so it can’t be deleted. Hide it instead.");
    await db.product.delete({ where: { id } });
    publish(TAGS.products);
    return { target: id, message: "Deleted." };
  });
}
