import type { Metadata } from "next";
import { env } from "./env";

/** Everyday name: titles, hero, footer. */
export const PERSON = "Abdul-Quddus Inda";
/** Full name (given name, father's name, family name, native name). Used in legal text and structured data. */
export const FULL_NAME = "Abdul-Quddus Sanusy Onuja Inda";
/** Every form people might search for, so they all lead here. */
export const NAME_VARIANTS = [FULL_NAME, "Abdul-Quddus Sanusy-Onuja", "Abdul-Quddus Sanusy Onuja", "Abdul Quddus Inda", "Abdul-Quddus Onuja", "Inda"];
/** schema.org name parts for the Person entity. */
export const NAME_PARTS = { givenName: "Abdul-Quddus", additionalName: "Sanusy Onuja", familyName: "Inda" };

export function ogUrl(title: string, kicker?: string) {
  const q = new URLSearchParams({ title: title.slice(0, 90) });
  if (kicker) q.set("k", kicker.slice(0, 40));
  return `/og?${q}`;
}

/** Page metadata with the site's exact naming convention: `Page — Abdul-Quddus Inda`. */
export function pageMeta(opts: { title?: string; description: string; path: string; ogImage?: string | null; kicker?: string; noindex?: boolean }): Metadata {
  const fullTitle = opts.title ? `${opts.title} — ${PERSON}` : `${PERSON} — Software engineer`;
  const image = opts.ogImage ?? ogUrl(opts.title ?? "Software engineer building secure, automated systems.", opts.kicker);
  return {
    title: { absolute: fullTitle },
    description: opts.description.slice(0, 155),
    alternates: { canonical: `${env.siteUrl}${opts.path}` },
    openGraph: { title: fullTitle, description: opts.description, url: `${env.siteUrl}${opts.path}`, siteName: "inda.dev", images: [{ url: image, width: 1200, height: 630 }], type: "website" },
    twitter: { card: "summary_large_image", title: fullTitle, description: opts.description, images: [image] },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}

export function jsonLd(data: object) {
  // Escape "<" so content can never close the script tag.
  return { __html: JSON.stringify(data).replace(/</g, "\u003c") };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${env.siteUrl}${it.path}` })),
  };
}
