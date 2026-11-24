import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ShieldCheck, Star } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { BuyButton } from "@/components/store/buy-dialog";
import { Price } from "@/components/store/price";
import { ProductViewTracker } from "@/components/store/product-view-tracker";
import { getMedia, getProduct, getProducts } from "@/lib/data";
import { db } from "@/lib/db";
import { breadcrumbs, jsonLd, pageMeta, PERSON } from "@/lib/seo";
import { PRODUCT_CATEGORIES } from "@/lib/content";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const seo = await db.seoMeta.findUnique({ where: { productId: p.id } });
  const cover = p.coverId ? (await getMedia([p.coverId]))[p.coverId] : undefined;
  return pageMeta({ title: seo?.title ?? p.title, description: seo?.description ?? p.summary, path: `/products/${slug}`, kicker: "Product", ogImage: cover?.url });
}

function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

function Stars({ value, label }: { value: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? `${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={i <= Math.round(value) ? "size-3.5 fill-accent-text text-accent-text" : "size-3.5 text-border-strong"} aria-hidden />
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const media = await getMedia([product.coverId, ...product.galleryIds].filter((x): x is string => Boolean(x)));
  const video = product.videoUrl ? youtubeEmbed(product.videoUrl) : null;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.summary,
    image: product.coverId && media[product.coverId] ? [media[product.coverId].url] : undefined,
    brand: { "@type": "Brand", name: "inda.dev" },
    category: PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES],
    offers: [
      { "@type": "Offer", price: (product.priceNGN / 100).toFixed(2), priceCurrency: "NGN", availability: "https://schema.org/InStock", url: `${env.siteUrl}/products/${product.slug}`, seller: { "@type": "Person", name: PERSON } },
    ],
    aggregateRating: product.rating.count ? { "@type": "AggregateRating", ratingValue: product.rating.average.toFixed(1), reviewCount: product.rating.count } : undefined,
    review: product.reviews.slice(0, 5).map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.name }, reviewRating: { "@type": "Rating", ratingValue: r.rating }, reviewBody: r.comment })),
  };
  const faqLd = product.faqs.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: product.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;

  const buy = { productId: product.id, title: product.title, priceNGN: product.priceNGN, isFree: product.isFree };

  return (
    <div className="container-page pt-10 pb-28 md:pt-16 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqLd)} />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }, { name: product.title, path: `/products/${product.slug}` }]))}
      />
      <ProductViewTracker productId={product.id} title={product.title} />

      <Link href="/products" className="inline-flex min-h-10 items-center gap-1.5 text-14 text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All products
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="eyebrow">{PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES]}</p>
          <h1 className="mt-3 text-40 md:text-48">{product.title}</h1>
          <p className="measure mt-4 text-18 text-muted">{product.summary}</p>
          {product.rating.count > 0 && (
            <p className="mt-4 flex items-center gap-2 text-14 text-muted">
              <Stars value={product.rating.average} /> {product.rating.average.toFixed(1)} · {product.rating.count} review{product.rating.count === 1 ? "" : "s"}
            </p>
          )}

          <MediaImage
            media={product.coverId ? media[product.coverId] : undefined}
            alt={`${product.title} preview`}
            label={product.title}
            priority
            sizes="(min-width:1024px) 680px, 100vw"
            className="mt-10 aspect-[16/10] rounded-xl border border-border"
          />
          {video && (
            <div className="mt-4 aspect-video overflow-hidden rounded-xl border border-border">
              <iframe src={video} title={`${product.title} video preview`} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
            </div>
          )}
          {product.galleryIds.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {product.galleryIds.map((id, i) => (
                <MediaImage key={id} media={media[id]} alt={media[id]?.alt || `${product.title}, image ${i + 2}`} sizes="(min-width:1024px) 330px, 50vw" className="aspect-[16/10] rounded-lg border border-border" />
              ))}
            </div>
          )}

          <section className="mt-14">
            <h2 className="text-24">About this product</h2>
            <div className="prose-plain measure mt-4 text-16 leading-relaxed text-muted">
              {product.description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {product.whatsInside.length > 0 && (
            <section className="mt-14">
              <h2 className="text-24">What’s inside</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {product.whatsInside.map((item) => (
                  <li key={item} className="flex gap-3 rounded-lg border border-border bg-surface p-4 text-14">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {product.audience && (
            <section className="mt-14">
              <h2 className="text-24">Who it’s for</h2>
              <p className="measure mt-4 text-16 leading-relaxed text-muted">{product.audience}</p>
            </section>
          )}

          <section className="mt-14">
            <h2 className="text-24">Reviews</h2>
            {product.reviews.length === 0 ? (
              <p className="mt-4 text-14 text-muted">No reviews yet. Only verified buyers can leave one.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {product.reviews.map((r, i) => (
                  <li key={i} className="rounded-lg border border-border p-5">
                    <div className="flex items-center justify-between gap-4">
                      <Stars value={r.rating} label={`${r.rating} out of 5 stars`} />
                      <span className="font-mono text-[0.75rem] text-subtle">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-14 leading-relaxed">{r.comment}</p>
                    <p className="mt-3 text-[0.8125rem] text-muted">
                      {r.name} · <span className="text-accent-text">Verified buyer</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {product.faqs.length > 0 && (
            <section className="mt-14">
              <h2 className="text-24">FAQs</h2>
              <div className="mt-5 divide-y divide-border border-y border-border">
                {product.faqs.map((f) => (
                  <details key={f.q} className="group py-4">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span aria-hidden className="font-mono text-subtle transition-transform duration-150 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="measure mt-2 text-14 leading-relaxed text-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Buy panel: sticky on desktop */}
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-surface p-6">
            <Price ngn={product.priceNGN} isFree={product.isFree} className="text-32 font-medium tracking-tight" />
            <div className="mt-6">
              <BuyButton {...buy} />
            </div>
            <ul className="mt-6 space-y-2.5 text-14 text-muted">
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden /> Instant download after payment
              </li>
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden /> Use in your own and client projects
              </li>
              <li className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden /> Secure checkout by Paystack
              </li>
            </ul>
            <p className="mt-6 border-t border-border pt-4 text-[0.8125rem] text-subtle">
              Covered by the{" "}
              <Link href="/license" className="link">
                license
              </Link>{" "}
              and{" "}
              <Link href="/refunds" className="link">
                refund policy
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>

      {/* Buy bar: sticky bottom on phones and tablets */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur-md lg:hidden">
        <div className="container-page flex items-center gap-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] text-muted">{product.title}</p>
            <Price ngn={product.priceNGN} isFree={product.isFree} className="text-18 font-medium" />
          </div>
          <div className="ml-auto w-40 shrink-0">
            <BuyButton {...buy} size="md" label={product.isFree ? "Get it" : "Buy"} />
          </div>
        </div>
      </div>
    </div>
  );
}
