import { db } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETENTION_MONTHS = 13;

/**
 * Nightly: roll the last 3 complete Lagos days into DailyStat (idempotent upserts),
 * then delete raw events older than 13 months and stale sessions/tokens.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });

  // Totals per day.
  await db.$executeRaw`
    INSERT INTO "DailyStat" (date, metric, dimension, key, count, sum)
    SELECT d::date, m.metric, 'all', 'all', m.count, 0 FROM (
      SELECT ((ts AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos')::date AS d,
             COUNT(*) AS pageviews, COUNT(DISTINCT "visitorId") AS visitors, COUNT(DISTINCT "sessionId") AS sessions
      FROM "Event"
      WHERE type = 'pageview'
        AND ((ts AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos')::date >= (now() AT TIME ZONE 'Africa/Lagos')::date - 3
        AND ((ts AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos')::date < (now() AT TIME ZONE 'Africa/Lagos')::date
      GROUP BY 1
    ) x
    CROSS JOIN LATERAL (VALUES ('pageviews', x.pageviews), ('visitors', x.visitors), ('sessions', x.sessions)) AS m(metric, count)
    ON CONFLICT (date, metric, dimension, key) DO UPDATE SET count = EXCLUDED.count`;

  // Page views by path, country and source per day.
  for (const dim of ["path", "country", "source"] as const) {
    const column = { path: `"path"`, country: `"country"`, source: `"source"` }[dim];
    await db.$executeRawUnsafe(`
      INSERT INTO "DailyStat" (date, metric, dimension, key, count, sum)
      SELECT ((ts AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos')::date, 'pageviews', '${dim}', COALESCE(${column}, 'unknown'), COUNT(*), 0
      FROM "Event"
      WHERE type = 'pageview'
        AND ((ts AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos')::date >= (now() AT TIME ZONE 'Africa/Lagos')::date - 3
        AND ((ts AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos')::date < (now() AT TIME ZONE 'Africa/Lagos')::date
      GROUP BY 1, 4
      ON CONFLICT (date, metric, dimension, key) DO UPDATE SET count = EXCLUDED.count`);
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  const [events, sessions, webhooks] = await Promise.all([
    db.event.deleteMany({ where: { ts: { lt: cutoff } } }),
    db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db.webhookEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 86400_000) } } }),
  ]);
  // Pending orders older than a day were abandoned.
  const abandoned = await db.order.updateMany({ where: { status: "pending", createdAt: { lt: new Date(Date.now() - 86400_000) } }, data: { status: "failed" } });

  return Response.json({ ok: true, deletedEvents: events.count, deletedSessions: sessions.count, deletedWebhooks: webhooks.count, abandonedOrders: abandoned.count });
}
