import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { SeoRow } from "@/components/admin/seo-row";

export const metadata = { title: "SEO" };

export default async function SeoPage() {
  const projects = await db.project.findMany({ orderBy: { order: "asc" }, select: { slug: true, title: true } });
  const pages = [
    { path: "/", label: "Home" },
    { path: "/products", label: "Products" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
    ...projects.map((p) => ({ path: `/work/${p.slug}`, label: `Case study: ${p.title}` })),
  ];
  const rows = await db.seoMeta.findMany({ where: { path: { in: pages.map((p) => p.path) } } });
  const ogIds = rows.map((r) => r.ogImageId).filter((x): x is string => Boolean(x));
  const media = ogIds.length ? await db.media.findMany({ where: { id: { in: ogIds } } }) : [];

  return (
    <>
      <PageHeader title="SEO" description="Titles, descriptions and share images are generated for every page automatically. Only open a page here if you want to write your own." />
      <div className="max-w-3xl space-y-3">
        {pages.map((p) => {
          const r = rows.find((x) => x.path === p.path);
          const m = r?.ogImageId ? media.find((x) => x.id === r.ogImageId) : null;
          return <SeoRow key={p.path} path={p.path} label={p.label} initial={{ title: r?.title ?? "", description: r?.description ?? "", og: m ? { id: m.id, url: m.url, filename: m.filename } : null }} />;
        })}
      </div>
    </>
  );
}
