import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { fail, json, readJson, sameOrigin } from "@/lib/api";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request";
import { alertOwner } from "@/lib/notify";

const schema = z.object({
  token: z.string().regex(/^[\w-]{20,80}$/),
  rating: z.number().int().min(1).max(5),
  name: z.string().trim().min(1, "Please add a name.").max(60),
  comment: z.string().trim().min(10, "Please write at least a sentence.").max(1500),
});

/** Verified buyers only: one review per order, held for approval. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  if (!(await rateLimit("review", clientIp(await headers()), 5, "1 h"))) return fail("Too many requests.", 429);
  const parsed = await readJson(req, schema);
  if ("res" in parsed) return parsed.res;
  const r = parsed.data;

  const dl = await db.downloadToken.findUnique({ where: { tokenHash: sha256(r.token) }, include: { order: { include: { review: true, product: true } } } });
  if (!dl || dl.order.status !== "paid") return fail("Only verified buyers can leave a review.", 403);
  if (dl.order.review) return fail("You have already reviewed this order.", 409);

  await db.review.create({ data: { productId: dl.order.productId, orderId: dl.orderId, name: r.name, rating: r.rating, comment: r.comment } });
  await alertOwner("New review to approve", `${r.rating}/5 for ${dl.order.product.title} by ${r.name}:\n\n${r.comment}`);
  return json({ ok: true });
}
