import type { Metadata } from "next";
import { ProductGrid } from "@/components/store/product-grid";
import { Empty } from "@/components/ui/misc";
import { getMedia, getProducts, getSeo } from "@/lib/data";
import { breadcrumbs, jsonLd, pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("/products");
  return pageMeta({
    title: seo?.title ?? "Products",
    description: seo?.description ?? "n8n workflow packs, Next.js + Postgres starter kits, home lab guides and server hardening checklists. Instant download.",
    path: "/products",
    kicker: "Products",
  });
}

export default async function ProductsPage() {
  const products = await getProducts();
  const media = await getMedia(products.map((p) => p.coverId).filter((x): x is string => Boolean(x)));
  return (
    <div className="container-page pt-12 md:pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }]))} />
      <header className="mb-12 md:mb-16">
        <div>
          <p className="eyebrow">Products</p>
          <h1 className="mt-3 text-40 md:text-48">Tools I use, packaged for you.</h1>
          <p className="measure mt-4 text-18 text-muted">Workflows, starter kits, guides and scripts from real projects. Pay once, download instantly, use in your own and client work.</p>
        </div>
      </header>
      {products.length ? <ProductGrid products={products} media={media} /> : <Empty title="No products yet">The first products are on the way.</Empty>}
    </div>
  );
}
