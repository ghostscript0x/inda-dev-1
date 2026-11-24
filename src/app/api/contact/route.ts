import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { emailSchema, fail, json, readJson, sameOrigin } from "@/lib/api";
import { rateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { clientIp } from "@/lib/request";
import { alertOwner } from "@/lib/notify";
import { BUDGETS, SERVICES } from "@/lib/content";
import { recordServerEvent } from "@/lib/analytics";

const schema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(100),
  email: emailSchema,
  service: z.enum(SERVICES),
  budget: z.enum(BUDGETS),
  message: z.string().trim().min(10, "A sentence or two helps me reply properly.").max(5000),
  website: z.string().max(200).optional(), // honeypot
  turnstileToken: z.string().max(4096).nullish(),
  visitorId: z.string().max(64).nullish(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  const h = await headers();
  const ip = clientIp(h);
  if (!(await rateLimit("contact", ip, 5, "1 h"))) return fail("Too many messages. Please email me directly.", 429);

  const parsed = await readJson(req, schema);
  if ("res" in parsed) return parsed.res;
  const m = parsed.data;
  if (m.website) return json({ ok: true }); // bot filled the honeypot; pretend success
  if (!(await verifyTurnstile(m.turnstileToken, ip))) return fail("Spam check failed. Please refresh and try again.");

  // Attribute the lead to the visitor's most recent traffic source.
  const lastVisit = m.visitorId ? await db.event.findFirst({ where: { visitorId: m.visitorId, type: "pageview", source: { not: "direct" } }, orderBy: { ts: "desc" }, select: { source: true, utmSource: true, referrer: true } }) : null;
  const source = lastVisit ? (lastVisit.utmSource ?? lastVisit.referrer ?? lastVisit.source) : "direct";

  const msg = await db.message.create({ data: { name: m.name, email: m.email, service: m.service, budget: m.budget, body: m.message, source } });
  await recordServerEvent({ type: "lead", path: "/contact", visitorId: m.visitorId ?? "server", props: { service: m.service, budget: m.budget, source } });
  await alertOwner(`New message: ${m.service}`, `${m.name} <${m.email}>\nBudget: ${m.budget}\nSource: ${source}\n\n${m.message}\n\nInbox: /admin/inbox/${msg.id}`);
  return json({ ok: true });
}
