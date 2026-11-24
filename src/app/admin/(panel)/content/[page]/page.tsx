import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { SectionsEditor, type SectionRow } from "@/components/admin/sections-editor";
import type { MediaRef } from "@/components/admin/uploader";
import { isSectionType } from "@/lib/content";

export const metadata = { title: "Content" };

const TITLES = { home: ["Homepage", "Edit the text, buttons and images of every section; show, hide or reorder them."], about: ["About page", "Story, photo, timeline, skills, certifications intro, home lab and CV."] } as const;

export default async function ContentPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (page !== "home" && page !== "about") notFound();
  const sections = await db.section.findMany({ where: { page }, orderBy: { order: "asc" } });
  const revisions = await db.revision.findMany({ where: { entity: "section", entityId: { in: sections.map((s) => s.id) } }, orderBy: { createdAt: "desc" }, select: { id: true, entityId: true, createdAt: true } });

  // Collect image IDs used by any section (e.g. the About photo) for previews.
  const ids = new Set<string>();
  for (const s of sections) {
    const d = (s.draftData ?? s.data) as Record<string, unknown>;
    if (typeof d.photoId === "string") ids.add(d.photoId);
  }
  const mediaRows = ids.size ? await db.media.findMany({ where: { id: { in: [...ids] } } }) : [];
  const media: Record<string, MediaRef> = Object.fromEntries(mediaRows.map((m) => [m.id, { id: m.id, url: m.url, filename: m.filename }]));

  const rows: SectionRow[] = sections
    .filter((s) => isSectionType(s.type))
    .map((s) => ({
      id: s.id,
      type: s.type as SectionRow["type"],
      visible: s.visible,
      data: (s.draftData ?? s.data) as Record<string, unknown>,
      hasDraft: s.draftData !== null,
      revisions: revisions.filter((r) => r.entityId === s.id).map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString() })),
    }));

  return (
    <>
      <PageHeader title={TITLES[page][0]} description={TITLES[page][1]} />
      <SectionsEditor page={page} rows={rows} media={media} />
    </>
  );
}
