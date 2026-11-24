import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { emailSchema, fail, json, readJson, sameOrigin } from "@/lib/api";
import { rateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { clientIp } from "@/lib/request";
import { issueDownloadToken, sendDownloadEmail } from "@/lib/store";

const schema = z.object({ email: emailSchema, turnstileToken: z.string().max(4096).nullish() });

/** Emails fresh download links. Always answers the same way so it can't be used to discover buyers. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  const h = await headers();
  const ip = clientIp(h);
  if (!(await rateLimit("lookup", ip, 5, "1 h"))) return fail("Too many requests. Please try again later.", 429);
  const parsed = await readJson(req, schema);
  if ("res" in parsed) return parsed.res;
  if (!(await rateLimit("lookup-email", parsed.data.email, 3, "1 h"))) return json({ ok: true });
  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) return fail("Spam check failed. Please refresh and try again.");

  const orders = await db.order.findMany({ where: { email: parsed.data.email, status: "paid" }, select: { id: true }, orderBy: { createdAt: "desc" }, take: 20 });
  for (const o of orders) {
    // Old links stop working once a fresh one is issued.
    await db.downloadToken.updateMany({ where: { orderId: o.id, lockedAt: null }, data: { downloadsLeft: 0 } });
    const token = await issueDownloadToken(o.id);
    await sendDownloadEmail(o.id, token);
  }
  return json({ ok: true });
}
