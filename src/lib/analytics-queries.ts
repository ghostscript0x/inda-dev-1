import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";

/** Dashboard queries over the Event table (raw, kept 13 months) and DailyStat (nightly rollup). */

const TZ = "Africa/Lagos"; // Nigeria: UTC+1, no DST
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export const RANGES = { today: "Today", "7d": "7 days", "30d": "30 days", "90d": "90 days", "12m": "12 months", custom: "Custom" } as const;
export type RangeKey = keyof typeof RANGES;

export const DIMENSIONS = {
  country: "country",
  city: "city",
  path: "path",
  source: "source",
  referrer: "referrer",
  device: "device",
  browser: "browser",
  os: "os",
  campaign: `"utmCampaign"`,
  utm_source: `"utmSource"`,
} as const;
export type Dimension = keyof typeof DIMENSIONS;

export type Range = { key: RangeKey; from: Date; to: Date; prevFrom: Date; prevTo: Date; bucket: "hour" | "day" | "month"; label: string };
export type Filters = Partial<Record<Dimension, string>>;

function lagosMidnight(d: Date) {
  const local = new Date(d.getTime() + LAGOS_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - LAGOS_OFFSET_MS);
}

export function parseRange(sp: { range?: string; from?: string; to?: string }): Range {
  const key = (sp.range && sp.range in RANGES ? sp.range : "30d") as RangeKey;
  const now = new Date();
  const day = 86400_000;
  let from: Date;
  let to = now;
  if (key === "today") from = lagosMidnight(now);
  else if (key === "7d") from = new Date(lagosMidnight(now).getTime() - 6 * day);
  else if (key === "90d") from = new Date(lagosMidnight(now).getTime() - 89 * day);
  else if (key === "12m") from = new Date(lagosMidnight(now).getTime() - 364 * day);
  else if (key === "custom" && sp.from && sp.to && !Number.isNaN(Date.parse(sp.from)) && !Number.isNaN(Date.parse(sp.to))) {
    from = lagosMidnight(new Date(sp.from));
    to = new Date(lagosMidnight(new Date(sp.to)).getTime() + day);
  } else from = new Date(lagosMidnight(now).getTime() - 29 * day);
  if (to <= from) to = new Date(from.getTime() + day);
  const span = to.getTime() - from.getTime();
  const bucket = span <= 2 * day ? "hour" : span > 120 * day ? "month" : "day";
  return { key, from, to, prevFrom: new Date(from.getTime() - span), prevTo: from, bucket, label: RANGES[key] };
}

export function parseFilters(sp: Record<string, string | undefined>): Filters {
  const f: Filters = {};
  for (const d of Object.keys(DIMENSIONS) as Dimension[]) {
    const v = sp[`f_${d}`];
    if (v && v.length <= 300) f[d] = v;
  }
  return f;
}

const col = (d: Dimension) => Prisma.raw(DIMENSIONS[d]);

function where(from: Date, to: Date, filters: Filters, extra?: Prisma.Sql) {
  const parts: Prisma.Sql[] = [Prisma.sql`ts >= ${from} AND ts < ${to}`];
  for (const [d, v] of Object.entries(filters) as [Dimension, string][]) parts.push(Prisma.sql`${col(d)} = ${v}`);
  if (extra) parts.push(extra);
  return Prisma.join(parts, " AND ");
}

const n = (v: unknown) => (typeof v === "bigint" ? Number(v) : typeof v === "number" ? v : v == null ? 0 : Number(v));
const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : null);
// Buckets come back as text keys of Lagos wall-clock time, formatted like ISO ("…Z" is only a key convention).
const KEY_FMT = `'YYYY-MM-DD"T"HH24:00:00.000"Z"'`;
const bucketExpr = (b: Range["bucket"], column = "ts") => Prisma.raw(`to_char(date_trunc('${b}', ("${column}" AT TIME ZONE 'UTC') AT TIME ZONE '${TZ}'), ${KEY_FMT})`);

// ───────── Overview ─────────

async function trafficTotals(from: Date, to: Date, f: Filters) {
  const w = where(from, to, f);
  const [row] = await db.$queryRaw<Record<string, unknown>[]>`
    WITH s AS (
      SELECT "sessionId",
             COUNT(*) FILTER (WHERE type = 'pageview') AS views,
             COALESCE(SUM(value) FILTER (WHERE type = 'leave'), 0) AS secs
      FROM "Event" WHERE ${w} AND "sessionId" NOT LIKE 'srv_%' GROUP BY "sessionId"
    )
    SELECT
      (SELECT COUNT(DISTINCT "visitorId") FROM "Event" WHERE ${w} AND type = 'pageview') AS visitors,
      (SELECT COUNT(*) FROM "Event" WHERE ${w} AND type = 'pageview') AS pageviews,
      (SELECT COUNT(DISTINCT "visitorId") FROM "Event" WHERE ${w} AND type = 'pageview' AND "isNew") AS new_visitors,
      (SELECT COUNT(*) FROM s WHERE views > 0) AS sessions,
      (SELECT COUNT(*) FROM s WHERE views = 1) AS bounces,
      (SELECT AVG(secs) FROM s WHERE views > 0) AS avg_secs`;
  const sessions = n(row.sessions);
  return {
    visitors: n(row.visitors),
    pageviews: n(row.pageviews),
    newVisitors: n(row.new_visitors),
    sessions,
    bounceRate: sessions ? (n(row.bounces) / sessions) * 100 : 0,
    avgSession: n(row.avg_secs),
    pagesPerSession: sessions ? n(row.pageviews) / sessions : 0,
  };
}

async function storeTotals(from: Date, to: Date, f: Filters) {
  const country = f.country ? Prisma.sql`AND country = ${f.country}` : Prisma.empty;
  const [row] = await db.$queryRaw<{ orders: bigint; revenue: bigint | null }[]>`
    SELECT COUNT(*) AS orders, SUM(amount) AS revenue FROM "Order"
    WHERE status = 'paid' AND amount > 0 AND "paidAt" >= ${from} AND "paidAt" < ${to} ${country}`;
  return { orders: n(row?.orders), ngn: n(row?.revenue) };
}

export async function overview(r: Range, f: Filters) {
  const [cur, prev, store, prevStore] = await Promise.all([trafficTotals(r.from, r.to, f), trafficTotals(r.prevFrom, r.prevTo, f), storeTotals(r.from, r.to, f), storeTotals(r.prevFrom, r.prevTo, f)]);
  const conv = cur.visitors ? (store.orders / cur.visitors) * 100 : 0;
  const prevConv = prev.visitors ? (prevStore.orders / prev.visitors) * 100 : 0;
  return {
    cur,
    store,
    conv,
    delta: {
      visitors: pct(cur.visitors, prev.visitors),
      pageviews: pct(cur.pageviews, prev.pageviews),
      sessions: pct(cur.sessions, prev.sessions),
      bounceRate: pct(cur.bounceRate, prev.bounceRate),
      avgSession: pct(cur.avgSession, prev.avgSession),
      orders: pct(store.orders, prevStore.orders),
      ngn: pct(store.ngn, prevStore.ngn),
      conv: pct(conv, prevConv),
    },
  };
}

export type SeriesPoint = { t: string; v: number };
export const SERIES_METRICS = { visitors: "Visitors", pageviews: "Page views", sessions: "Sessions", orders: "Orders", revenue_ngn: "Revenue" } as const;
export type SeriesMetric = keyof typeof SERIES_METRICS;

/** Fill missing buckets with zeros so lines don't skip days. */
function fill(rows: { t: string; v: unknown }[], r: Range, from: Date, to: Date): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const x of rows) map.set(x.t, (map.get(x.t) ?? 0) + n(x.v));
  const out: SeriesPoint[] = [];
  const start = new Date(from.getTime() + LAGOS_OFFSET_MS);
  if (r.bucket === "hour") start.setUTCMinutes(0, 0, 0);
  else if (r.bucket === "day") start.setUTCHours(0, 0, 0, 0);
  else {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
  }
  const end = to.getTime() + LAGOS_OFFSET_MS;
  for (const d = new Date(start); d.getTime() < end; ) {
    const key = d.toISOString();
    out.push({ t: key, v: map.get(key) ?? 0 });
    if (r.bucket === "hour") d.setUTCHours(d.getUTCHours() + 1);
    else if (r.bucket === "day") d.setUTCDate(d.getUTCDate() + 1);
    else d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

export async function series(metric: SeriesMetric, r: Range, f: Filters, which: "cur" | "prev" = "cur"): Promise<SeriesPoint[]> {
  const from = which === "cur" ? r.from : r.prevFrom;
  const to = which === "cur" ? r.to : r.prevTo;
  const b = bucketExpr(r.bucket);
  let rows: { t: string; v: unknown }[];
  if (metric === "orders" || metric === "revenue_ngn") {
    const value = metric === "orders" ? Prisma.sql`COUNT(*)` : Prisma.sql`SUM(amount)`;
    const cur = Prisma.sql`AND amount > 0`;
    const country = f.country ? Prisma.sql`AND country = ${f.country}` : Prisma.empty;
    const tb = bucketExpr(r.bucket, "paidAt");
    rows = await db.$queryRaw`SELECT ${tb} AS t, ${value} AS v FROM "Order" WHERE status = 'paid' AND "paidAt" >= ${from} AND "paidAt" < ${to} ${cur} ${country} GROUP BY 1 ORDER BY 1`;
  } else if (r.bucket === "month" && Object.keys(f).length === 0 && metric !== "sessions") {
    // Long ranges read the nightly rollup (plus today's raw events) to stay fast.
    const rolled = await db.$queryRaw<{ t: string; v: unknown }[]>`
      SELECT to_char(date_trunc('month', date), ${Prisma.raw(KEY_FMT)}) AS t, SUM(count) AS v FROM "DailyStat"
      WHERE metric = ${metric} AND dimension = 'all' AND date >= ${from}::date AND date < ${to}::date GROUP BY 1 ORDER BY 1`;
    const today = lagosMidnight(new Date());
    const live = await db.$queryRaw<{ t: string; v: unknown }[]>`
      SELECT ${bucketExpr("month")} AS t,
             ${metric === "visitors" ? Prisma.sql`COUNT(DISTINCT "visitorId")` : Prisma.sql`COUNT(*)`} AS v
      FROM "Event" WHERE type = 'pageview' AND ts >= ${today} GROUP BY 1`;
    // If the rollup has never run (fresh install), fall back to raw events.
    rows = rolled.length ? [...rolled, ...live] : await rawSeries(metric, b, from, to, f);
  } else rows = await rawSeries(metric, b, from, to, f);
  return fill(rows, r, from, to);
}

function rawSeries(metric: SeriesMetric, b: Prisma.Sql, from: Date, to: Date, f: Filters) {
  const value = metric === "visitors" ? Prisma.sql`COUNT(DISTINCT "visitorId")` : metric === "sessions" ? Prisma.sql`COUNT(DISTINCT "sessionId")` : Prisma.sql`COUNT(*)`;
  return db.$queryRaw<{ t: string; v: unknown }[]>`SELECT ${b} AS t, ${value} AS v FROM "Event" WHERE ${where(from, to, f, Prisma.sql`type = 'pageview'`)} GROUP BY 1 ORDER BY 1`;
}

// ───────── Realtime ─────────

export async function realtime() {
  const since = new Date(Date.now() - 5 * 60_000);
  const [count, pages, sources, feed] = await Promise.all([
    db.$queryRaw<{ c: bigint }[]>`SELECT COUNT(DISTINCT "visitorId") AS c FROM "Event" WHERE ts >= ${since} AND "sessionId" NOT LIKE 'srv_%'`,
    db.$queryRaw<{ path: string; c: bigint }[]>`
      SELECT path, COUNT(*) AS c FROM (
        SELECT DISTINCT ON ("visitorId") "visitorId", path FROM "Event" WHERE ts >= ${since} AND type = 'pageview' ORDER BY "visitorId", ts DESC
      ) x GROUP BY path ORDER BY c DESC LIMIT 10`,
    db.$queryRaw<{ k: string; c: bigint }[]>`SELECT COALESCE(referrer, source, 'direct') AS k, COUNT(DISTINCT "visitorId") AS c FROM "Event" WHERE ts >= ${since} AND type = 'pageview' GROUP BY 1 ORDER BY c DESC LIMIT 8`,
    db.event.findMany({ where: { ts: { gte: new Date(Date.now() - 60 * 60_000) }, type: { in: ["pageview", "product_view", "buy_click", "checkout_start", "purchase", "download", "lead", "search", "cv_download", "outbound", "404"] } }, orderBy: { ts: "desc" }, take: 40, select: { id: true, ts: true, type: true, path: true, city: true, country: true, props: true } }),
  ]);
  return { now: n(count[0]?.c), pages: pages.map((p) => ({ key: p.path, value: n(p.c) })), sources: sources.map((s) => ({ key: s.k, value: n(s.c) })), feed: feed.map((e) => ({ ...e, ts: e.ts.toISOString(), props: (e.props ?? null) as Record<string, unknown> | null })) };
}

// ───────── Breakdown tables ─────────

export type Row = { key: string; value: number; [k: string]: string | number | null };

export async function breakdown(dim: Dimension | "lang" | "screen" | "theme" | "timezone" | "region", r: Range, f: Filters, limit = 50): Promise<Row[]> {
  const c = Prisma.raw(dim in DIMENSIONS ? DIMENSIONS[dim as Dimension] : `"${dim}"`);
  const rows = await db.$queryRaw<{ k: string | null; v: bigint; views: bigint }[]>`
    SELECT ${c} AS k, COUNT(DISTINCT "visitorId") AS v, COUNT(*) AS views FROM "Event"
    WHERE ${where(r.from, r.to, f, Prisma.sql`type = 'pageview'`)} GROUP BY 1 ORDER BY v DESC LIMIT ${limit}`;
  return rows.map((x) => ({ key: x.k ?? "Unknown", value: n(x.v), views: n(x.views) }));
}

export async function pagesTable(r: Range, f: Filters) {
  const w = where(r.from, r.to, f);
  const rows = await db.$queryRaw<Record<string, unknown>[]>`
    WITH ev AS (SELECT * FROM "Event" WHERE ${w}),
    pv AS (SELECT path, COUNT(*) AS views, COUNT(DISTINCT "visitorId") AS visitors FROM ev WHERE type = 'pageview' GROUP BY path),
    tm AS (SELECT path, AVG(value) AS secs FROM ev WHERE type = 'leave' AND value > 0 AND value < 3600 GROUP BY path),
    sc AS (SELECT path, AVG(d) AS depth FROM (SELECT path, "sessionId", MAX((props->>'depth')::int) AS d FROM ev WHERE type = 'scroll' GROUP BY path, "sessionId") x GROUP BY path),
    ordered AS (SELECT "sessionId", path, ROW_NUMBER() OVER (PARTITION BY "sessionId" ORDER BY ts ASC) AS first_n, ROW_NUMBER() OVER (PARTITION BY "sessionId" ORDER BY ts DESC) AS last_n FROM ev WHERE type = 'pageview'),
    en AS (SELECT path, COUNT(*) AS entries FROM ordered WHERE first_n = 1 GROUP BY path),
    ex AS (SELECT path, COUNT(*) AS exits FROM ordered WHERE last_n = 1 GROUP BY path)
    SELECT pv.path, pv.views, pv.visitors, tm.secs, sc.depth, COALESCE(en.entries, 0) AS entries, COALESCE(ex.exits, 0) AS exits
    FROM pv LEFT JOIN tm USING (path) LEFT JOIN sc USING (path) LEFT JOIN en USING (path) LEFT JOIN ex USING (path)
    ORDER BY pv.views DESC LIMIT 200`;
  return rows.map((x) => ({
    key: String(x.path),
    value: n(x.views),
    visitors: n(x.visitors),
    secs: x.secs == null ? null : Math.round(n(x.secs)),
    depth: x.depth == null ? null : Math.round(n(x.depth)),
    entries: n(x.entries),
    exitRate: n(x.views) ? Math.round((n(x.exits) / n(x.views)) * 100) : 0,
  }));
}

export async function notFoundHits(r: Range) {
  const rows = await db.$queryRaw<{ k: string; from: string | null; c: bigint }[]>`
    SELECT COALESCE(props->>'url', path) AS k, MAX(props->>'from') AS from, COUNT(*) AS c FROM "Event"
    WHERE type = '404' AND ts >= ${r.from} AND ts < ${r.to} GROUP BY 1 ORDER BY c DESC LIMIT 50`;
  return rows.map((x) => ({ key: x.k, value: n(x.c), from: x.from }));
}

/** Sources with visitors, conversion rate and revenue (orders attributed by visitor). */
export async function sourcesTable(dim: "source" | "referrer" | "campaign" | "utm_source", r: Range, f: Filters) {
  const c = col(dim);
  const rows = await db.$queryRaw<{ k: string | null; visitors: bigint; orders: bigint; ngn: bigint | null }[]>`
    WITH v AS (
      SELECT DISTINCT ON ("visitorId") "visitorId", ${c} AS k FROM "Event"
      WHERE ${where(r.from, r.to, f, Prisma.sql`type = 'pageview'`)} ORDER BY "visitorId", ts ASC
    )
    SELECT v.k, COUNT(DISTINCT v."visitorId") AS visitors, COUNT(o.id) AS orders,
      SUM(o.amount) AS ngn
    FROM v LEFT JOIN "Order" o ON o."visitorId" = v."visitorId" AND o.status = 'paid' AND o.amount > 0 AND o."paidAt" >= ${r.from} AND o."paidAt" < ${r.to}
    GROUP BY v.k ORDER BY visitors DESC LIMIT 100`;
  return rows.map((x) => ({ key: x.k ?? (dim === "source" ? "direct" : "(none)"), value: n(x.visitors), orders: n(x.orders), conv: n(x.visitors) ? +((n(x.orders) / n(x.visitors)) * 100).toFixed(1) : 0, ngn: n(x.ngn) }));
}

// ───────── Store ─────────

export async function storeFunnel(r: Range, productId?: string) {
  const prod = productId ? Prisma.sql`AND props->>'productId' = ${productId}` : Prisma.empty;
  const [ev] = await db.$queryRaw<Record<string, bigint>[]>`
    SELECT
      COUNT(DISTINCT "visitorId") FILTER (WHERE type = 'product_view') AS views,
      COUNT(DISTINCT "visitorId") FILTER (WHERE type = 'buy_click') AS buys,
      COUNT(*) FILTER (WHERE type = 'checkout_start') AS checkouts
    FROM "Event" WHERE ts >= ${r.from} AND ts < ${r.to} ${prod}`;
  const orderWhere = { createdAt: { gte: r.from, lt: r.to }, ...(productId ? { productId } : {}) };
  const [paid, abandoned, downloaded] = await Promise.all([
    db.order.count({ where: { ...orderWhere, status: "paid" } }),
    db.order.count({ where: { ...orderWhere, status: { in: ["pending", "failed"] } } }),
    db.order.count({ where: { ...orderWhere, status: "paid", downloads: { some: {} } } }),
  ]);
  return {
    steps: [
      { key: "Product view", value: n(ev.views) },
      { key: "Buy click", value: n(ev.buys) },
      { key: "Checkout started", value: n(ev.checkouts) },
      { key: "Paid", value: paid },
      { key: "Downloaded", value: downloaded },
    ],
    abandoned,
  };
}

export async function storeBreakdowns(r: Range) {
  const [products, countries, sources, coupons, views] = await Promise.all([
    db.$queryRaw<{ id: string; title: string; orders: bigint; ngn: bigint | null }[]>`
      SELECT p.id, p.title, COUNT(o.id) AS orders, SUM(o.amount) AS ngn
      FROM "Order" o JOIN "Product" p ON p.id = o."productId" WHERE o.status = 'paid' AND o."paidAt" >= ${r.from} AND o."paidAt" < ${r.to}
      GROUP BY p.id, p.title ORDER BY orders DESC`,
    db.$queryRaw<{ k: string | null; orders: bigint; ngn: bigint | null }[]>`
      SELECT country AS k, COUNT(*) AS orders, SUM(amount) AS ngn
      FROM "Order" WHERE status = 'paid' AND amount > 0 AND "paidAt" >= ${r.from} AND "paidAt" < ${r.to} GROUP BY 1 ORDER BY orders DESC LIMIT 20`,
    db.$queryRaw<{ k: string | null; orders: bigint; ngn: bigint | null }[]>`
      SELECT COALESCE(e.referrer, e.source, 'direct') AS k, COUNT(DISTINCT o.id) AS orders,
        SUM(o.amount) AS ngn
      FROM "Order" o LEFT JOIN LATERAL (
        SELECT referrer, source FROM "Event" WHERE "visitorId" = o."visitorId" AND type = 'pageview' AND ts <= o."createdAt" ORDER BY ts ASC LIMIT 1
      ) e ON true
      WHERE o.status = 'paid' AND o.amount > 0 AND o."paidAt" >= ${r.from} AND o."paidAt" < ${r.to} GROUP BY 1 ORDER BY orders DESC LIMIT 20`,
    db.$queryRaw<{ code: string; uses: bigint }[]>`
      SELECT c.code, COUNT(o.id) AS uses FROM "Order" o JOIN "Coupon" c ON c.id = o."couponId"
      WHERE o.status = 'paid' AND o."paidAt" >= ${r.from} AND o."paidAt" < ${r.to} GROUP BY c.code ORDER BY uses DESC`,
    db.$queryRaw<{ id: string; v: bigint }[]>`
      SELECT props->>'productId' AS id, COUNT(DISTINCT "visitorId") AS v FROM "Event" WHERE type = 'product_view' AND ts >= ${r.from} AND ts < ${r.to} GROUP BY 1`,
  ]);
  const viewMap = new Map(views.map((v) => [v.id, n(v.v)]));
  const money = (x: { ngn: bigint | null }) => ({ ngn: n(x.ngn) });
  return {
    products: products.map((p) => ({ key: p.title, id: p.id, value: n(p.orders), ...money(p), views: viewMap.get(p.id) ?? 0, conv: viewMap.get(p.id) ? +((n(p.orders) / viewMap.get(p.id)!) * 100).toFixed(1) : 0 })),
    countries: countries.map((c) => ({ key: c.k ?? "Unknown", value: n(c.orders), ...money(c) })),
    sources: sources.map((s) => ({ key: s.k ?? "direct", value: n(s.orders), ...money(s) })),
    coupons: coupons.map((c) => ({ key: c.code, value: n(c.uses) })),
  };
}

// ───────── Engagement ─────────

export async function engagement(r: Range, f: Filters) {
  const w = where(r.from, r.to, f);
  const [clicks, social, contacts, searches, depth, leads] = await Promise.all([
    db.$queryRaw<{ k: string; c: bigint }[]>`SELECT props->>'id' AS k, COUNT(*) AS c FROM "Event" WHERE ${w} AND type = 'click' AND props->>'id' IS NOT NULL GROUP BY 1 ORDER BY c DESC LIMIT 40`,
    db.$queryRaw<{ k: string; c: bigint }[]>`SELECT REPLACE(props->>'id', 'social_', '') AS k, COUNT(*) AS c FROM "Event" WHERE ${w} AND type = 'click' AND props->>'id' LIKE 'social_%' GROUP BY 1 ORDER BY c DESC`,
    db.$queryRaw<{ k: string; c: bigint }[]>`SELECT type AS k, COUNT(*) AS c FROM "Event" WHERE ${w} AND type IN ('email_click', 'whatsapp_click', 'cv_download', 'outbound', 'contact_start', 'contact_submit', 'lead') GROUP BY 1`,
    db.$queryRaw<{ k: string; c: bigint }[]>`SELECT LOWER(props->>'q') AS k, COUNT(*) AS c FROM "Event" WHERE ${w} AND type = 'search' GROUP BY 1 ORDER BY c DESC LIMIT 30`,
    db.$queryRaw<{ k: string; c: bigint }[]>`SELECT props->>'depth' AS k, COUNT(*) AS c FROM "Event" WHERE ${w} AND type = 'scroll' GROUP BY 1`,
    db.$queryRaw<{ service: string; budget: string; c: bigint }[]>`SELECT service, budget, COUNT(*) AS c FROM "Message" WHERE "createdAt" >= ${r.from} AND "createdAt" < ${r.to} GROUP BY 1, 2 ORDER BY c DESC`,
  ]);
  const get = (k: string) => n(contacts.find((c) => c.k === k)?.c);
  const map = (rows: { k: string; c: bigint }[]) => rows.map((x) => ({ key: x.k ?? "(unknown)", value: n(x.c) }));
  return {
    clicks: map(clicks),
    social: map(social),
    channels: [
      { key: "Email clicks", value: get("email_click") },
      { key: "WhatsApp clicks", value: get("whatsapp_click") },
      { key: "CV downloads", value: get("cv_download") },
      { key: "Outbound links", value: get("outbound") },
    ],
    contactFunnel: [
      { key: "Form started", value: get("contact_start") },
      { key: "Form submitted", value: Math.max(get("contact_submit"), get("lead")) },
    ],
    searches: map(searches),
    depth: [25, 50, 75, 100].map((d) => ({ key: `${d}%`, value: n(depth.find((x) => x.k === String(d))?.c) })),
    leads: leads.map((l) => ({ key: `${l.service} · ${l.budget}`, value: n(l.c) })),
  };
}

// ───────── Performance ─────────

export type VitalRow = { path: string; device: string; samples: number; lcp: number | null; inp: number | null; cls: number | null; ttfb: number | null };

export async function vitals(r: Range, f: Filters): Promise<VitalRow[]> {
  const rows = await db.$queryRaw<Record<string, unknown>[]>`
    SELECT path, CASE WHEN device = 'desktop' THEN 'desktop' ELSE 'phone' END AS device, COUNT(*) AS samples,
      percentile_cont(0.75) WITHIN GROUP (ORDER BY (props->>'lcp')::float) AS lcp,
      percentile_cont(0.75) WITHIN GROUP (ORDER BY (props->>'inp')::float) AS inp,
      percentile_cont(0.75) WITHIN GROUP (ORDER BY (props->>'cls')::float) AS cls,
      percentile_cont(0.75) WITHIN GROUP (ORDER BY (props->>'ttfb')::float) AS ttfb
    FROM "Event" WHERE ${where(r.from, r.to, f, Prisma.sql`type = 'vitals'`)}
    GROUP BY 1, 2 ORDER BY samples DESC LIMIT 100`;
  const num = (v: unknown) => (v == null ? null : n(v));
  return rows.map((x) => ({ path: String(x.path), device: String(x.device), samples: n(x.samples), lcp: num(x.lcp), inp: num(x.inp), cls: num(x.cls), ttfb: num(x.ttfb) }));
}

export const VITAL_THRESHOLDS = { lcp: [2500, 4000], inp: [200, 500], cls: [0.1, 0.25], ttfb: [800, 1800] } as const;
export function rate(metric: keyof typeof VITAL_THRESHOLDS, v: number | null) {
  if (v == null) return null;
  const [good, poor] = VITAL_THRESHOLDS[metric];
  return v <= good ? "good" : v <= poor ? "needs work" : "poor";
}
