import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { SocialIcon } from "@/components/social-icon";
import { Tag } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { getMedia, getProject, getProjects, getSeo } from "@/lib/data";
import { breadcrumbs, jsonLd, pageMeta, PERSON } from "@/lib/seo";
import { PILLARS } from "@/lib/content";
import { env } from "@/lib/env";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [p, seo] = await Promise.all([getProject(slug), getSeo(`/work/${slug}`)]);
  if (!p) return {};
  const cover = p.coverId ? (await getMedia([p.coverId]))[p.coverId] : undefined;
  return pageMeta({ title: seo?.title ?? p.title, description: seo?.description ?? `${p.summary} ${p.result}`, path: `/work/${slug}`, kicker: "Case study", ogImage: cover?.url });
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="grid gap-4 border-t border-border py-12 md:grid-cols-12 md:gap-10 md:py-16">
        <h2 className="eyebrow md:col-span-3 md:pt-1.5">{title}</h2>
        <div className="space-y-4 md:col-span-9">{children}</div>
      </section>
    </Reveal>
  );
}

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((t, i) => (
      <p key={i} className={i === 0 ? "measure text-18 leading-relaxed" : "measure text-18 leading-relaxed text-muted"}>
        {t}
      </p>
    ));

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getProject(slug), getProjects()]);
  if (!project) notFound();
  const media = await getMedia([project.coverId, ...project.galleryIds].filter((x): x is string => Boolean(x)));
  const idx = all.findIndex((p) => p.slug === slug);
  const next = all.length > 1 && idx >= 0 ? all[(idx + 1) % all.length] : null;
  const c = project.content;

  const ld = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    abstract: project.summary,
    author: { "@type": "Person", name: PERSON, url: env.siteUrl },
    url: `${env.siteUrl}/work/${project.slug}`,
    keywords: project.stack.join(", "),
    dateModified: project.updatedAt,
  };
  const crumbs = breadcrumbs([
    { name: "Home", path: "/" },
    { name: "Work", path: "/#work" },
    { name: project.title, path: `/work/${project.slug}` },
  ]);

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
      <header className="container-page pt-12 md:pt-20">
        <Link href="/#work" className="inline-flex min-h-10 items-center gap-1.5 text-14 text-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> All work
        </Link>
        <p className="eyebrow mt-10">
          Case study · {PILLARS[project.pillar as keyof typeof PILLARS]?.long ?? project.pillar}
          {project.industry ? ` · ${project.industry}` : ""}
        </p>
        <h1 className="mt-4 max-w-4xl text-40 md:text-64">{project.title}</h1>
        <p className="measure mt-6 text-18 text-muted">{project.summary}</p>
        {project.results.length > 0 && (
          <dl className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            {project.results.map((r) => (
              <div key={r.label} className="bg-bg p-5 md:p-6">
                <dt className="text-14 text-muted">{r.label}</dt>
                <dd className="mt-1.5 font-mono text-32 font-medium tracking-tight">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <MediaImage
          media={project.coverId ? media[project.coverId] : undefined}
          alt={`${project.title} screenshot`}
          label={project.title}
          sizes="(min-width:1200px) 1136px, 100vw"
          priority
          className="mt-12 aspect-[16/9] rounded-xl border border-border"
        />
      </header>

      <div className="container-page mt-8">
        {c.problem && <Block title="Problem">{paragraphs(c.problem)}</Block>}
        {c.approach && <Block title="Approach">{paragraphs(c.approach)}</Block>}
        {c.architecture && (
          <Block title="Architecture">
            <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-5 font-mono text-[0.8125rem] leading-relaxed text-muted" aria-label="Architecture diagram">
              {c.architecture}
            </pre>
          </Block>
        )}
        {(c.code || project.galleryIds.length > 0) && (
          <Block title="Key code & screens">
            {c.code && (
              <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-5 font-mono text-[0.8125rem] leading-relaxed">
                <code data-lang={c.codeLang}>{c.code}</code>
              </pre>
            )}
            {project.galleryIds.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {project.galleryIds.map((id, i) => (
                  <MediaImage key={id} media={media[id]} alt={media[id]?.alt || `${project.title}, screenshot ${i + 2}`} sizes="(min-width:768px) 420px, 100vw" className="aspect-[16/10] rounded-lg border border-border" />
                ))}
              </div>
            )}
          </Block>
        )}
        {c.results && <Block title="Results">{paragraphs(c.results)}</Block>}
        <Block title="Stack">
          <ul className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li key={s}>
                <Tag>{s}</Tag>
              </li>
            ))}
          </ul>
        </Block>
        {(project.liveUrl || project.repoUrl) && (
          <Block title="Links">
            <div className="flex flex-wrap gap-3">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "outline" })} data-track="work_live">
                  <ExternalLink aria-hidden /> Live site
                </a>
              )}
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "outline" })} data-track="work_repo">
                  <SocialIcon network="github" className="size-4" /> Source on GitHub
                </a>
              )}
            </div>
          </Block>
        )}
      </div>

      {next && next.slug !== project.slug && (
        <div className="container-page mt-8">
          <Link
            href={`/work/${next.slug}`}
            className="group flex items-center justify-between gap-6 rounded-xl border border-border bg-surface p-6 transition-colors duration-150 hover:border-border-strong md:p-10"
            data-track="work_next"
          >
            <div>
              <p className="eyebrow">Next project</p>
              <p className="mt-2 text-24 font-semibold tracking-tight md:text-32">{next.title}</p>
              <p className="mt-1 text-muted">{next.result}</p>
            </div>
            <ArrowRight className="size-6 shrink-0 text-accent-text transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      )}
    </article>
  );
}
