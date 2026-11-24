import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { Price } from "./price";
import { PRODUCT_CATEGORIES } from "@/lib/content";
import type { MediaInfo, ProductCard as Card } from "@/lib/data";

export function ProductCard({ product, cover, priority }: { product: Card; cover?: MediaInfo; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-150 hover:border-border-strong">
      <MediaImage media={cover} alt={`${product.title} cover`} label={product.title} sizes="(min-width:1024px) 380px, (min-width:768px) 50vw, 100vw" className="aspect-[16/10] border-b border-border" priority={priority} />
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES] ?? product.category}</p>
        <h3 className="mt-2 text-18 font-semibold tracking-tight">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:content-['']" data-track="product_card">
            {product.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-14 text-muted">{product.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <Price ngn={product.priceNGN} isFree={product.isFree} className="text-16 text-fg" />
          <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-14 font-medium text-accent-ink transition-transform duration-150 group-hover:translate-x-0.5">
            {product.isFree ? "Get it" : "Buy"} <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}
