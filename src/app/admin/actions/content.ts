"use server";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isSectionType, sectionDefs } from "@/lib/content";
import { TAGS } from "@/lib/data";
import { adminAction, publish, saveRevision } from "./common";

async function validated(id: string, data: unknown) {
  const s = await db.section.findUniqueOrThrow({ where: { id } });
  if (!isSectionType(s.type)) throw new Error(`Unknown section type ${s.type}`);
  const parsed = sectionDefs[s.type].schema.safeParse(data);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    throw new Error(`${i.path.join(" › ") || "Section"}: ${i.message}`);
  }
  return { section: s, data: parsed.data };
}

/** Save edits as a draft (visible only in preview). Used by autosave. */
export async function saveSectionDraft(id: string, data: unknown) {
  return adminAction("section.draft", async (userId) => {
    const { data: clean } = await validated(id, data);
    await db.section.update({ where: { id }, data: { draftData: clean as object } });
    await saveRevision("section", id, clean, userId);
    return { target: id };
  });
}

export async function publishSection(id: string, data: unknown) {
  return adminAction("section.publish", async (userId) => {
    const { data: clean } = await validated(id, data);
    await db.section.update({ where: { id }, data: { data: clean as object, draftData: Prisma.DbNull } });
    await saveRevision("section", id, clean, userId);
    publish(TAGS.sections);
    return { target: id, message: "Published. Live within seconds." };
  });
}

export async function publishPage(page: "home" | "about") {
  return adminAction("page.publish", async () => {
    const drafts = await db.section.findMany({ where: { page, NOT: { draftData: { equals: Prisma.DbNull } } } });
    let n = 0;
    for (const s of drafts) {
      if (s.draftData === null) continue;
      await db.section.update({ where: { id: s.id }, data: { data: s.draftData as object, draftData: Prisma.DbNull } });
      n++;
    }
    publish(TAGS.sections);
    return { target: page, meta: { sections: n }, message: n ? `Published ${n} section${n === 1 ? "" : "s"}.` : "Nothing new to publish." };
  });
}

export async function discardSectionDraft(id: string) {
  return adminAction("section.discard", async () => {
    await db.section.update({ where: { id }, data: { draftData: Prisma.DbNull } });
    return { target: id, message: "Draft discarded." };
  });
}

export async function setSectionVisible(id: string, visible: boolean) {
  return adminAction("section.visibility", async () => {
    await db.section.update({ where: { id }, data: { visible } });
    publish(TAGS.sections);
    return { target: id, meta: { visible }, message: visible ? "Section shown." : "Section hidden." };
  });
}

export async function reorderSections(page: "home" | "about", ids: string[]) {
  return adminAction("section.reorder", async () => {
    const rows = await db.section.findMany({ where: { page }, select: { id: true } });
    const known = new Set(rows.map((r) => r.id));
    if (ids.length !== rows.length || !ids.every((id) => known.has(id))) throw new Error("Section list is out of date. Reload the page.");
    await db.$transaction(ids.map((id, order) => db.section.update({ where: { id }, data: { order } })));
    publish(TAGS.sections);
    return { target: page, message: "Order saved." };
  });
}
