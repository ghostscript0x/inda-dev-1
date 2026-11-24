import type { Metadata } from "next";
import { Download, ExternalLink, Server } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { Timeline } from "@/components/sections/timeline";
import { Badge, Tag } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { getCertifications, getMedia, getSections, getSeo, getSettings, type SectionBlock } from "@/lib/data";
import { breadcrumbs, jsonLd, pageMeta, PERSON } from "@/lib/seo";
import { PILLARS } from "@/lib/content";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("/about");
  return pageMeta({
    title: seo?.title ?? "About",
    description: seo?.description ?? "Software engineer in Nigeria working across web and backend development, AI automation, and network & security engineering.",
    path: "/about",
    kicker: "About",
  });
}

function Wrap({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <Reveal>
      <section id={id} className="border-t border-border py-14 md:py-20">
        <h2 className="mb-8 text-24 md:mb-10 md:text-32">{title}</h2>
        {children}
      </section>
    </Reveal>
  );
}

export default async function AboutPage() {
  const [sections, certs, settings] = await Promise.all([getSections("about"), getCertifications(), getSettings()]);
  const story = sections.find((s) => s.type === "story");
  const photoId = story?.type === "story" ? story.data.photoId : null;
  const media = photoId ? await getMedia([photoId]) : {};

  const render = (s: SectionBlock) => {
    switch (s.type) {
      case "story":
        return (
          <header key={s.id} className="grid gap-10 pt-12 pb-16 md:grid-cols-12 md:pt-20 md:pb-20">
            <div className="md:col-span-7">
              <p className="eyebrow">About</p>
              <h1 className="mt-3 text-40 md:text-48">{s.data.title}</h1>
              <div className="measure mt-6 space-y-4 text-18 leading-relaxed text-muted">
                {s.data.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div className="md:col-span-4 md:col-start-9">
              <MediaImage media={s.data.photoId ? media[s.data.photoId] : undefined} alt={`Photo of ${PERSON}`} label="Photo" priority sizes="(min-width:768px) 360px, 100vw" className="aspect-[4/5] rounded-xl border border-border" />
            </div>
          </header>
        );
      case "timeline":
        return (
          <Wrap key={s.id} title={s.data.title}>
            <Timeline items={s.data.items} />
          </Wrap>
        );
      case "skills":
        return (
          <Wrap key={s.id} title={s.data.title}>
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
              {s.data.groups.map((g) => (
                <div key={g.key} className="bg-bg p-6">
                  <p className="eyebrow">{PILLARS[g.key].long}</p>
                  <h3 className="mt-2 text-18">{g.title}</h3>
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {g.skills.map((sk) => (
                      <li key={sk}>
                        <Tag>{sk}</Tag>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Wrap>
        );
      case "certifications":
        return certs.length === 0 ? null : (
          <Wrap key={s.id} title={s.data.title} id="certifications">
            {s.data.intro && <p className="measure -mt-4 mb-8 text-muted">{s.data.intro}</p>}
            <ul className="divide-y divide-border rounded-xl border border-border">
              {certs.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-accent-text">
                          {c.name} <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      ) : (
                        c.name
                      )}
                    </p>
                    <p className="text-14 text-muted">
                      {c.issuer}
                      {c.date ? ` · ${c.date}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:w-56 sm:justify-end">
                    {c.status === "in_progress" && (
                      <div className="h-1 w-full max-w-28 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={c.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.name} progress`}>
                        <div className="h-full rounded-full bg-accent" style={{ width: `${c.progress}%` }} />
                      </div>
                    )}
                    <Badge tone={c.status === "done" ? "accent" : c.status === "in_progress" ? "warning" : "muted"}>{c.status === "done" ? "Earned" : c.status === "in_progress" ? `In progress` : "Planned"}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Wrap>
        );
      case "homelab":
        return (
          <Wrap key={s.id} title={s.data.title} id="homelab">
            <div className="grid gap-8 md:grid-cols-12">
              <p className="measure leading-relaxed text-muted md:col-span-7">{s.data.text}</p>
              <ul className="space-y-2 rounded-xl border border-border bg-surface p-5 font-mono text-[0.8125rem] md:col-span-5">
                {s.data.items.map((it) => (
                  <li key={it} className="flex gap-3">
                    <Server className="mt-0.5 size-3.5 shrink-0 text-accent-text" aria-hidden />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </Wrap>
        );
      case "cv":
        return settings.cvUrl ? (
          <Wrap key={s.id} title={s.data.title}>
            <p className="measure -mt-4 text-muted">{s.data.text}</p>
            <a href={settings.cvUrl} download className={buttonClass({ variant: "outline", size: "lg" }, "mt-6")} data-track="cv_download_button">
              <Download aria-hidden /> Download CV (PDF)
            </a>
          </Wrap>
        ) : null;
      default:
        return null;
    }
  };

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON,
    alternateName: ["Abdul Quddus Inda", "Inda"],
    url: env.siteUrl,
    jobTitle: "Software Engineer",
    image: photoId && media[photoId] ? media[photoId].url : undefined,
    hasCredential: certs.filter((c) => c.status === "done").map((c) => ({ "@type": "EducationalOccupationalCredential", name: c.name, recognizedBy: { "@type": "Organization", name: c.issuer } })),
    sameAs: settings.socials.filter((s) => /^https?:/.test(s.href) && s.network !== "whatsapp").map((s) => s.href),
  };

  return (
    <div className="container-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(person)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: "About", path: "/about" }]))} />
      {sections.map(render)}
    </div>
  );
}
