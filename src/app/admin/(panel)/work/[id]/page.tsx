import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { ProjectEditor, type ProjectEditorValue } from "@/components/admin/project-editor";
import type { ProjectContent } from "@/lib/content";

export const metadata = { title: "Case study" };

const EMPTY: ProjectEditorValue = {
  title: "",
  slug: "",
  pillar: "build",
  industry: "",
  summary: "",
  result: "",
  content: { problem: "", approach: "", architecture: "", code: "", codeLang: "ts", results: "" },
  stack: "",
  results: [],
  cover: null,
  gallery: [],
  liveUrl: "",
  repoUrl: "",
  published: false,
};

export default async function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const p = isNew ? null : await db.project.findUnique({ where: { id } });
  if (!isNew && !p) notFound();
  const mediaIds = p ? [p.coverId, ...p.galleryIds].filter((x): x is string => Boolean(x)) : [];
  const media = mediaIds.length ? await db.media.findMany({ where: { id: { in: mediaIds } } }) : [];
  const ref = (mid: string) => {
    const m = media.find((x) => x.id === mid);
    return m ? { id: m.id, url: m.url, filename: m.filename } : null;
  };
  const revisions = p ? await db.revision.findMany({ where: { entity: "project", entityId: p.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, createdAt: true } }) : [];

  const initial: ProjectEditorValue = p
    ? {
        id: p.id,
        title: p.title,
        slug: p.slug,
        pillar: p.pillar as ProjectEditorValue["pillar"],
        industry: p.industry,
        summary: p.summary,
        result: p.result,
        content: { ...EMPTY.content, ...(p.content as Partial<ProjectContent>) },
        stack: p.stack.join(", "),
        results: p.results as ProjectEditorValue["results"],
        cover: p.coverId ? ref(p.coverId) : null,
        gallery: p.galleryIds.map(ref).filter((x): x is NonNullable<typeof x> => Boolean(x)),
        liveUrl: p.liveUrl ?? "",
        repoUrl: p.repoUrl ?? "",
        published: p.published,
      }
    : EMPTY;

  return (
    <>
      <Link href="/admin/work" className="mb-4 inline-flex items-center gap-1.5 text-14 text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Work
      </Link>
      <PageHeader title={isNew ? "New case study" : p!.title} />
      <ProjectEditor initial={initial} revisions={revisions.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString() }))} />
    </>
  );
}
