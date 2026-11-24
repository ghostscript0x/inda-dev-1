import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { getLegal } from "@/lib/data";
import { breadcrumbs, jsonLd, pageMeta } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export type LegalSlug = "privacy" | "terms" | "refunds" | "license";

export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const doc = await getLegal(slug);
  if (!doc) return {};
  return pageMeta({ title: doc.title, description: `${doc.title} for inda.dev (inda.name.ng), the site and store of Abdul-Quddus Inda.`, path: `/${slug}`, kicker: "Legal" });
}

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = await getLegal(slug);
  if (!doc) notFound();
  return (
    <article className="container-page pt-12 md:pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: doc.title, path: `/${slug}` }]))} />
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 text-40 md:text-48">{doc.title}</h1>
      <p className="mt-3 font-mono text-[0.8125rem] text-subtle">Last updated {formatDate(doc.updatedAt)}</p>
      <div className="measure mt-10 text-16 leading-relaxed text-muted [&_h2]:text-fg [&_h3]:text-fg [&_strong]:text-fg">
        <Markdown source={doc.body} />
      </div>
    </article>
  );
}
