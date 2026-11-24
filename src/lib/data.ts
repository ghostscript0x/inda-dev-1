import "server-only";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { db } from "./db";
import { isSectionType, resolveSocials, socialSchema, type SectionData, type SectionType, type Social, type ProjectContent } from "./content";
import { z } from "zod";

/**
 * Public read layer. Everything is cached with tags and refreshed on publish
 * via revalidateTag(tag, "max"). Draft mode bypasses the cache and reads drafts.
 * Results go through JSON, so dates are returned as ISO strings.
 */
export const TAGS = {
  settings: "settings",
  sections: "sections",
  projects: "projects",
  products: "products",
  reviews: "reviews",
  people: "people", // testimonials + certifications
  legal: "legal",
  seo: "seo",
  media: "media",
} as const;

const cached = <A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string, tags: string[]) =>
  unstable_cache(fn, [key], { tags, revalidate: 3600 });

export async function isDraft() {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false; // outside a request (e.g. generateStaticParams)
  }
}

// ── Settings ──
export type SiteSettings = {
  name: string;
  tagline: string;
  bio: string;
  email: string;
  whatsapp: string;
  bookingUrl: string;
  availability: boolean;
  availabilityText: string;
  socials: Social[];
  cvUrl: string | null;
};

export const getSettings = cached(
  async (): Promise<SiteSettings> => {
    const s = await db.siteSettings.findUnique({ where: { id: 1 } });
    if (!s) throw new Error("SiteSettings row is missing. Run `npm run db:seed`.");
    const socials = z.array(socialSchema).safeParse(s.socials);
    return {
      name: s.name,
      tagline: s.tagline,
      bio: s.bio,
      email: s.email,
      whatsapp: s.whatsapp,
      bookingUrl: s.bookingUrl,
      availability: s.availability,
      availabilityText: s.availabilityText,
      socials: socials.success ? resolveSocials(socials.data, s) : [],
      cvUrl: s.cvFileId ? "/api/cv" : null,
    };
  },
  "settings",
  [TAGS.settings],
);

// ── Sections ──
export type SectionBlock = { [T in SectionType]: { id: string; type: T; data: SectionData<T> } }[SectionType];

async function loadSections(page: string, draft: boolean): Promise<SectionBlock[]> {
  const rows = await db.section.findMany({ where: { page, visible: true }, orderBy: { order: "asc" } });
  return rows.flatMap((r) => {
    if (!isSectionType(r.type)) return [];
    return [{ id: r.id, type: r.type, data: (draft && r.draftData ? r.draftData : r.data) } as SectionBlock];
  });
}
const getSectionsCached = cached((page: string) => loadSections(page, false), "sections", [TAGS.sections]);

export async function getSections(page: "home" | "about") {
  return (await isDraft()) ? loadSections(page, true) : getSectionsCached(page);
}

// ── Media ──
export type MediaInfo = { id: string; url: string; width: number | null; height: number | null; alt: string };
export const getMedia = cached(
  async (ids: string[]): Promise<Record<string, MediaInfo>> => {
    if (!ids.length) return {};
    const rows = await db.media.findMany({ where: { id: { in: ids }, private: false } });
    return Object.fromEntries(rows.map((m) => [m.id, { id: m.id, url: m.url, width: m.width, height: m.height, alt: m.alt }]));
  },
  "media",
  [TAGS.media],
);

// ── Projects ──
export type ProjectListItem = {
  slug: string;
  title: string;
  pillar: string;
  summary: string;
  result: string;
  stack: string[];
  coverId: string | null;
};
export type ProjectFull = ProjectListItem & {
  industry: string;
  content: ProjectContent;
  results: { label: string; value: string }[];
  galleryIds: string[];
  liveUrl: string | null;
  repoUrl: string | null;
  updatedAt: string;
};

export const getProjects = cached(
  async (): Promise<ProjectListItem[]> =>
    db.project.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      select: { slug: true, title: true, pillar: true, summary: true, result: true, stack: true, coverId: true },
    }),
  "projects",
  [TAGS.projects],
);

async function loadProject(slug: string, draft: boolean): Promise<ProjectFull | null> {
  const p = await db.project.findUnique({ where: { slug } });
  if (!p || (!p.published && !draft)) return null;
  return {
    slug: p.slug,
    title: p.title,
    pillar: p.pillar,
    summary: p.summary,
    result: p.result,
    stack: p.stack,
    coverId: p.coverId,
    industry: p.industry,
    content: p.content as ProjectContent,
    results: p.results as { label: string; value: string }[],
    galleryIds: p.galleryIds,
    liveUrl: p.liveUrl,
    repoUrl: p.repoUrl,
    updatedAt: p.updatedAt.toISOString(),
  };
}
const getProjectCached = cached((slug: string) => loadProject(slug, false), "project", [TAGS.projects]);
export async function getProject(slug: string) {
  return (await isDraft()) ? loadProject(slug, true) : getProjectCached(slug);
}

// ── Products ──
export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  priceNGN: number;
  isFree: boolean;
  coverId: string | null;
  featured: boolean;
  createdAt: string;
};
export type ProductFull = ProductCard & {
  description: string;
  whatsInside: string[];
  audience: string;
  faqs: { q: string; a: string }[];
  galleryIds: string[];
  videoUrl: string | null;
  updatedAt: string;
  rating: { average: number; count: number };
  reviews: { name: string; rating: number; comment: string; createdAt: string }[];
};

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  category: true,
  priceNGN: true,
  isFree: true,
  coverId: true,
  featured: true,
  createdAt: true,
} as const;

export const getProducts = cached(
  async (): Promise<ProductCard[]> => {
    const rows = await db.product.findMany({ where: { status: "published" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], select: cardSelect });
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  },
  "products",
  [TAGS.products],
);

export async function getFeaturedProducts(limit = 3) {
  const all = await getProducts();
  const featured = all.filter((p) => p.featured);
  const rest = all.filter((p) => !p.featured).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...featured, ...rest].slice(0, limit);
}

async function loadProduct(slug: string, draft: boolean): Promise<ProductFull | null> {
  const p = await db.product.findUnique({
    where: { slug },
    include: { reviews: { where: { approved: true }, orderBy: { createdAt: "desc" }, take: 30 } },
  });
  if (!p || (p.status !== "published" && !draft)) return null;
  const count = p.reviews.length;
  const average = count ? p.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    category: p.category,
    priceNGN: p.priceNGN,
    isFree: p.isFree,
    coverId: p.coverId,
    featured: p.featured,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    description: p.description,
    whatsInside: p.whatsInside,
    audience: p.audience,
    faqs: p.faqs as { q: string; a: string }[],
    galleryIds: p.galleryIds,
    videoUrl: p.videoUrl,
    rating: { average, count },
    reviews: p.reviews.map((r) => ({ name: r.name, rating: r.rating, comment: r.comment, createdAt: r.createdAt.toISOString() })),
  };
}
const getProductCached = cached((slug: string) => loadProduct(slug, false), "product", [TAGS.products, TAGS.reviews]);
export async function getProduct(slug: string) {
  return (await isDraft()) ? loadProduct(slug, true) : getProductCached(slug);
}

// ── People ──
export const getTestimonials = cached(
  async () => db.testimonial.findMany({ where: { visible: true }, orderBy: { order: "asc" }, select: { id: true, quote: true, name: true, role: true } }),
  "testimonials",
  [TAGS.people],
);
export const getCertifications = cached(
  async () => db.certification.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, issuer: true, status: true, progress: true, date: true, url: true } }),
  "certifications",
  [TAGS.people],
);

// ── Legal & SEO ──
export const getLegal = cached(
  async (slug: string) => {
    const d = await db.legalDoc.findUnique({ where: { slug } });
    return d ? { title: d.title, body: d.body, updatedAt: d.updatedAt.toISOString() } : null;
  },
  "legal",
  [TAGS.legal],
);

export const getSeo = cached(
  async (path: string) => {
    const s = await db.seoMeta.findUnique({ where: { path } });
    return s ? { title: s.title, description: s.description, ogImageId: s.ogImageId } : null;
  },
  "seo",
  [TAGS.seo],
);

// ── Command menu index ──
export async function getSearchIndex() {
  const [projects, products] = await Promise.all([getProjects(), getProducts()]);
  return {
    projects: projects.map((p) => ({ title: p.title, href: `/work/${p.slug}`, hint: p.result })),
    products: products.map((p) => ({ title: p.title, href: `/products/${p.slug}`, hint: p.summary })),
  };
}
