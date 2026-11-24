"use server";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/** Read one saved version (restoring happens client-side by loading it into the editor, then saving). */
export async function getRevisionData(id: string) {
  await requireAdmin();
  const r = await db.revision.findUnique({ where: { id } });
  return r ? { entity: r.entity, entityId: r.entityId, data: r.data, createdAt: r.createdAt.toISOString() } : null;
}
