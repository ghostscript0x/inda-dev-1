import { headers, cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { classifySource, parseUA } from "@/lib/analytics";
import { geoFromHeaders, clientIp } from "@/lib/request";
import { rateLimit } from "@/lib/ratelimit";
import { SESSION_COOKIE } from "@/lib/auth";

const TYPES = ["pageview", "leave", "scroll", "click", "outbound", "email_click", "whatsapp_click", "cv_download", "search", "vitals", "404", "product_view", "buy_click", "contact_start", "contact_submit"] as const;

const s = (n: number) => z.string().max(n).nullish();
const schema = z.object({
  t: z.enum(TYPES),
  p: z.string().max(300).startsWith("/"),
  v: z.string().min(6).max(64),
  s: z.string().min(6).max(64),
  n: z.boolean().optional(),
  r: s(500),
  u: z.object({ s: s(100), m: s(100), c: s(100) }).nullish(),
  sc: s(20),
  l: s(20),
  z: s(60),
  th: s(10),
  pr: z.record(z.string().max(40), z.union([z.string().max(300), z.number(), z.boolean(), z.null()])).nullish(),
  val: z.number().finite().nullish(),
});

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  const h = await headers();
  // Privacy + accuracy: honour DNT/GPC, drop bots and the site owner's own visits.
  if (h.get("dnt") === "1" || h.get("sec-gpc") === "1") return noContent();
  if ((await cookies()).get(SESSION_COOKIE)) return noContent();
  const ua = h.get("user-agent") ?? "";
  const agent = parseUA(ua);
  if (agent.bot || !ua) return noContent();
  if (!(await rateLimit("events", clientIp(h), 240, "1 m"))) return new Response(null, { status: 429 });

  const text = await req.text();
  if (text.length > 8192) return new Response(null, { status: 413 });
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return new Response(null, { status: 400 });
  const e = parsed.data;

  const siteHost = new URL(env.siteUrl).host;
  const { source, referrerHost } = classifySource(e.r ?? null, e.u?.s ?? null, siteHost);
  const geo = geoFromHeaders(h);

  await db.event.create({
    data: {
      type: e.t,
      path: e.p.split("?")[0],
      visitorId: e.v,
      sessionId: e.s,
      isNew: e.t === "pageview" && Boolean(e.n),
      referrer: referrerHost,
      source: e.t === "pageview" ? source : null,
      utmSource: e.u?.s ?? null,
      utmMedium: e.u?.m ?? null,
      utmCampaign: e.u?.c ?? null,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      device: agent.device,
      browser: agent.browser,
      os: agent.os,
      screen: e.sc ?? null,
      lang: e.l ?? null,
      timezone: e.z ?? null,
      theme: e.th ?? null,
      props: e.pr ?? undefined,
      value: e.val ?? null,
    },
  });
  return noContent();
}
