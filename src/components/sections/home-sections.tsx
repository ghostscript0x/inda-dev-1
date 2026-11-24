import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Mail,
  MessageCircle,
} from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading, Tag } from "@/components/ui/misc";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PILLARS, type SectionData } from "@/lib/content";
import type {
  MediaInfo,
  ProductCard as ProductCardData,
  ProjectListItem,
  SiteSettings,
} from "@/lib/data";

export function WorkList({
  data,
  projects,
  media,
}: {
  data: SectionData<"work">;
  projects: ProjectListItem[];
  media: Record<string, MediaInfo>;
}) {
  return (
    <section id="work" className="container-page scroll-mt-20 py-20 md:py-28">
      <SectionHeading
        eyebrow={data.eyebrow}
        title={data.title}
        intro={data.intro}
      />
      {projects.length === 0 ? (
        <p className="text-muted">
          Case studies are being written up. Check back soon.
        </p>
      ) : (
        <ol className="grid gap-5 md:grid-cols-2">
          {projects.map((p, i) => {
            const cover = p.coverId ? media[p.coverId] : undefined;
            const extra = p.stack.length - 4;
            return (
              <li key={p.slug} className="flex">
                <Reveal delay={i * 0.05} className="flex w-full">
                  <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-150 hover:border-border-strong">
                    {/* Only a real screenshot gets space; no empty placeholder boxes. */}
                    {cover && (
                      <MediaImage
                        media={cover}
                        alt={`${p.title} screenshot`}
                        sizes="(min-width:1024px) 560px, (min-width:768px) 50vw, 100vw"
                        priority={i === 0}
                        className="aspect-[16/9] border-b border-border"
                      />
                    )}
                    <div className="flex flex-1 flex-col p-6 md:p-7">
                      <p className="flex items-center justify-between gap-3 font-mono text-[0.75rem] text-subtle">
                        <span>
                          {String(i + 1).padStart(2, "0")} ·{" "}
                          <span className="text-accent-text">
                            {PILLARS[p.pillar as keyof typeof PILLARS]?.label ??
                              p.pillar}
                          </span>
                        </span>
                        {p.industry && (
                          <span className="truncate">{p.industry}</span>
                        )}
                      </p>
                      <h3 className="mt-4 text-24 font-semibold tracking-tight">
                        <Link
                          href={`/work/${p.slug}`}
                          className="after:absolute after:inset-0 after:content-['']"
                          data-track="work_open"
                        >
                          {p.title}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-3 text-14 text-muted md:text-16">
                        {p.summary}
                      </p>
                      <p className="mt-4 flex items-start gap-2.5 text-14">
                        <span
                          aria-hidden
                          className="mt-2.5 h-px w-4 shrink-0 bg-accent"
                        />
                        <span>{p.result}</span>
                      </p>
                      <ul
                        className="mt-5 flex flex-wrap gap-1.5"
                        aria-label="Stack"
                      >
                        {p.stack.slice(0, 4).map((s) => (
                          <li key={s}>
                            <Tag>{s}</Tag>
                          </li>
                        ))}
                        {extra > 0 && (
                          <li>
                            <Tag>+{extra}</Tag>
                          </li>
                        )}
                      </ul>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-14 text-accent-text">
                        Read case study{" "}
                        <ArrowUpRight
                          className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function Pillars({ data }: { data: SectionData<"pillars"> }) {
  return (
    <section id="services" className="border-y border-border bg-surface/50">
      <div className="container-page py-20 md:py-28">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} />
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p, i) => (
            <Reveal key={p.key} delay={i * 0.05} className="bg-bg">
              <div className="flex h-full flex-col p-6 md:p-8">
                <p className="eyebrow flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-px rotate-[35deg] bg-accent"
                  />
                  {PILLARS[p.key].long}
                </p>
                <h3 className="mt-4 text-24">{p.title}</h3>
                <p className="mt-3 text-muted">{p.sentence}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.capabilities.map((c) => (
                    <li key={c} className="flex gap-3 text-14">
                      <span
                        aria-hidden
                        className="mt-2 h-px w-3 shrink-0 bg-border-strong"
                      />
                      {c}
                    </li>
                  ))}
                </ul>
                <ul
                  className="mt-auto flex flex-wrap gap-1.5 pt-8"
                  aria-label={`${p.title} tools`}
                >
                  {p.tools.map((t) => (
                    <li key={t}>
                      <Tag>{t}</Tag>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductsSection({
  data,
  products,
  media,
}: {
  data: SectionData<"products">;
  products: ProductCardData[];
  media: Record<string, MediaInfo>;
}) {
  if (!products.length) return null;
  return (
    <section className="container-page py-20 md:py-28">
      <SectionHeading
        eyebrow={data.eyebrow}
        title={data.title}
        intro={data.intro}
        action={
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-14 text-accent-text hover:underline"
            data-track="products_all"
          >
            All products <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.05} className="flex">
            <ProductCard
              product={p}
              cover={p.coverId ? media[p.coverId] : undefined}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Proof({
  data,
  testimonials,
}: {
  data: SectionData<"proof">;
  testimonials: { id: string; quote: string; name: string; role: string }[];
}) {
  if (!testimonials.length && !data.stats.length) return null;
  return (
    <section className="container-page py-20 md:py-28">
      <SectionHeading eyebrow={data.eyebrow} title={data.title} />
      {data.stats.length > 0 && (
        <dl className="mb-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {data.stats.map((s) => (
            <div key={s.label} className="bg-bg p-6 md:p-8">
              <dt className="text-14 text-muted">{s.label}</dt>
              <dd className="mt-2 font-mono text-40 font-medium tracking-tight">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="flex flex-col rounded-xl border border-border bg-surface p-6"
          >
            <blockquote className="text-16 leading-relaxed">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-auto pt-6 text-14">
              <span className="font-medium">{t.name}</span>
              <span className="block text-muted">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ContactCta({
  data,
  settings,
}: {
  data: SectionData<"contact">;
  settings: SiteSettings;
}) {
  const wa = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`;
  return (
    <section className="container-page py-20 md:py-28">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-6 py-14 md:px-14 md:py-20">
        <svg
          aria-hidden
          viewBox="0 0 200 200"
          className="pointer-events-none absolute -top-10 -right-10 size-64 text-border-strong md:size-80"
        >
          <path d="M20 180 L180 20" stroke="currentColor" strokeWidth="1" />
          <path d="M60 180 L180 60" stroke="var(--accent)" strokeWidth="1.5" />
        </svg>
        <h2 className="relative max-w-2xl text-32 md:text-48">{data.title}</h2>
        <p className="measure relative mt-4 text-18 text-muted">{data.text}</p>
        <div className="relative mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink
            href="/contact"
            size="lg"
            data-track="cta_contact_section"
          >
            Start a project <ArrowRight aria-hidden />
          </ButtonLink>
          <a
            href={`mailto:${settings.email}`}
            className={buttonClass({ variant: "outline", size: "lg" })}
            data-track="cta_email"
          >
            <Mail aria-hidden /> Email
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: "outline", size: "lg" })}
            data-track="cta_whatsapp"
          >
            <MessageCircle aria-hidden /> WhatsApp
          </a>
          {settings.bookingUrl && (
            <a
              href={settings.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: "outline", size: "lg" })}
              data-track="cta_booking"
            >
              <Calendar aria-hidden /> Book a call
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
