import { db } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron";
import { alertOwner } from "@/lib/notify";

export const dynamic = "force-dynamic";

const SPIKE_FACTOR = 3; // yesterday vs the 14-day daily average
const SPIKE_MIN_VIEWS = 100;
const NOT_FOUND_MIN_HITS = 5;

/** Daily checks: traffic spikes and URLs that started throwing 404s. Sale alerts are sent instantly from the webhook. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  const day = 86400_000;
  const now = Date.now();
  const yStart = new Date(now - day);
  const [yesterday, baseline] = await Promise.all([db.event.count({ where: { type: "pageview", ts: { gte: yStart } } }), db.event.count({ where: { type: "pageview", ts: { gte: new Date(now - 15 * day), lt: yStart } } })]);
  const avg = baseline / 14;
  const alerts: string[] = [];
  if (yesterday >= SPIKE_MIN_VIEWS && avg > 0 && yesterday > avg * SPIKE_FACTOR) {
    const top = await db.event.groupBy({ by: ["referrer"], where: { type: "pageview", ts: { gte: yStart }, referrer: { not: null } }, _count: true, orderBy: { _count: { referrer: "desc" } }, take: 3 });
    alerts.push(`Traffic spike: ${yesterday} page views in the last 24h (usual ≈ ${Math.round(avg)}/day). Top referrers: ${top.map((t) => `${t.referrer} (${t._count})`).join(", ") || "direct"}.`);
  }

  // URLs with 5+ 404 hits in the last 24h that had none in the week before.
  const broken = await db.$queryRaw<{ url: string; c: bigint }[]>`
    WITH recent AS (
      SELECT COALESCE(props->>'url', path) AS url, COUNT(*) AS c FROM "Event"
      WHERE type = '404' AND ts >= ${yStart} GROUP BY 1 HAVING COUNT(*) >= ${NOT_FOUND_MIN_HITS}
    ), before AS (
      SELECT DISTINCT COALESCE(props->>'url', path) AS url FROM "Event"
      WHERE type = '404' AND ts < ${yStart} AND ts >= ${new Date(now - 8 * day)}
    )
    SELECT recent.url, recent.c FROM recent LEFT JOIN before USING (url) WHERE before.url IS NULL
    ORDER BY recent.c DESC LIMIT 10`;
  if (broken.length) alerts.push(`New 404s in the last 24h:\n${broken.map((b) => `  ${b.url} — ${Number(b.c)} hits`).join("\n")}\nAdd a redirect or fix the link.`);

  if (alerts.length) await alertOwner("Site alert", alerts.join("\n\n"));
  return Response.json({ ok: true, alerts: alerts.length });
}
