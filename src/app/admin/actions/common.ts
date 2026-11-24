import "server-only";
import { updateTag } from "next/cache";
import { audit, requireWriter } from "@/lib/auth";
import { db } from "@/lib/db";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/** Wrap an admin mutation: verified non-demo session, audit log, readable errors. */
export async function adminAction<T>(action: string, fn: (userId: string) => Promise<{ target?: string; data?: T; message?: string; meta?: Record<string, unknown> }>): Promise<ActionResult<T>> {
  let userId: string;
  try {
    userId = (await requireWriter()).user.id;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Not allowed." };
  }
  try {
    const res = await fn(userId);
    await audit(userId, action, res.target, res.meta);
    return { ok: true, data: res.data, message: res.message };
  } catch (e) {
    console.error(`[admin:${action}]`, e);
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    return { ok: false, error: /Unique constraint/i.test(msg) ? "That slug or code is already in use." : msg };
  }
}

export async function saveRevision(entity: string, entityId: string, data: unknown, userId: string) {
  await db.revision.create({ data: { entity, entityId, data: data as object, userId } });
  // Keep the last 50 versions per entity.
  const old = await db.revision.findMany({ where: { entity, entityId }, orderBy: { createdAt: "desc" }, skip: 50, select: { id: true } });
  if (old.length) await db.revision.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}

/**
 * Expire the public data behind these tags immediately, so the very next visit shows the change.
 * (revalidateTag(…, "max") would serve the old page once more while refreshing in the background.)
 * Only callable from Server Actions, which is where every admin save runs.
 */
export function publish(...tags: string[]) {
  for (const t of tags) updateTag(t);
}
