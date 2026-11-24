import Image from "next/image";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SocialIcon } from "@/components/social-icon";
import type { SectionData, Social } from "@/lib/content";
import type { MediaInfo } from "@/lib/data";
import { HeroSystem, type PillarInfo } from "./hero-system";

type Props = {
  data: SectionData<"hero">;
  name: string;
  available: boolean;
  availabilityText: string;
  pillars?: PillarInfo[];
  photo?: MediaInfo | null;
  email: string;
  socials: Social[];
};

export function Hero({ data, name, available, availabilityText, pillars, photo, email, socials }: Props) {
  // Your name comes from Site settings. Older saved heroes don't have role/location yet.
  const role = data.role || "Software engineer";
  const location = data.location || "";
  const links = socials.filter((s) => s.network !== "email" && /^https?:\/\/[^/]+\/.+/.test(s.href)); // skip unfilled "https://github.com/" placeholders

  return (
    <section className="container-page grid items-center gap-14 pt-10 pb-20 md:pt-16 md:pb-28 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-6">
        <div className="flex items-center gap-3">
          {photo && (
            <span className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border-strong bg-surface-2">
              <Image src={photo.url} alt={`Photo of ${name}`} fill sizes="48px" priority className="object-cover" />
            </span>
          )}
          {available && (
            <p className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-surface px-3 text-[0.8125rem] text-muted">
              <span aria-hidden className="size-1.5 rounded-full bg-accent motion-safe:animate-[pulse-dot_2.4s_ease-in-out_infinite]" />
              {availabilityText}
            </p>
          )}
        </div>

        <h1 className="mt-8 text-48 leading-[1.02] font-semibold tracking-[-0.035em] text-balance md:text-64">{name}</h1>

        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-16">
          <span className="font-medium text-accent-text">{role}</span>
          {location && (
            <>
              <span aria-hidden className="h-4 w-px bg-border-strong" />
              <span className="inline-flex items-center gap-1.5 text-muted">
                <MapPin className="size-4 text-subtle" aria-hidden />
                {location}
              </span>
            </>
          )}
        </p>

        <p className="mt-8 max-w-xl text-24 leading-snug font-medium tracking-tight text-pretty md:text-[1.75rem]">{data.headline}</p>
        <p className="measure mt-4 text-16 text-pretty text-muted md:text-18">{data.subline}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={data.primary.href} size="lg" data-track="cta_hero_primary">
            {data.primary.label} <ArrowRight aria-hidden />
          </ButtonLink>
          <ButtonLink href={data.secondary.href} size="lg" variant="outline" data-track="cta_hero_secondary">
            {data.secondary.label}
          </ButtonLink>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-6">
          <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-14 text-muted transition-colors hover:text-fg" data-track="hero_email">
            <Mail className="size-4 text-subtle" aria-hidden />
            {email}
          </a>
          {links.length > 0 && (
            <ul className="flex items-center gap-1" aria-label="Social links">
              {links.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    data-track={`hero_social_${s.network}`}
                    className="flex size-9 items-center justify-center rounded-md text-subtle transition-colors duration-150 hover:bg-surface-2 hover:text-accent-text"
                  >
                    <SocialIcon network={s.network} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="lg:col-span-6">
        <HeroSystem pillars={pillars} />
      </div>
    </section>
  );
}
