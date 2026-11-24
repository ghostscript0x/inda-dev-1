import { getSession } from "@/lib/auth";
import { breakdown, engagement, pagesTable, parseFilters, parseRange, sourcesTable, storeBreakdowns, vitals } from "@/lib/analytics-queries";

export const dynamic = "force-dynamic";

function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "no data\n";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Neutralise spreadsheet formula injection and quote when needed.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s?.verified) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const r = parseRange(sp);
  const f = parseFilters(sp);
  const tab = sp.tab ?? "pages";

  let rows: Record<string, unknown>[];
  switch (tab) {
    case "sources":
      rows = (await sourcesTable("source", r, f)).map((x) => ({ source: x.key, visitors: x.value, orders: x.orders, conversion_pct: x.conv, revenue_ngn: x.ngn / 100 }));
      break;
    case "audience":
      rows = (await breakdown("country", r, f, 500)).map((x) => ({ country: x.key, visitors: x.value, pageviews: x.views }));
      break;
    case "store":
      rows = (await storeBreakdowns(r)).products.map((x) => ({ product: x.key, orders: x.value, viewers: x.views, conversion_pct: x.conv, revenue_ngn: x.ngn / 100 }));
      break;
    case "engagement":
      rows = (await engagement(r, f)).clicks.map((x) => ({ element: x.key, clicks: x.value }));
      break;
    case "performance":
      rows = (await vitals(r, f)).map((x) => ({ ...x }));
      break;
    default:
      rows = (await pagesTable(r, f)).map((x) => ({ path: x.key, views: x.value, visitors: x.visitors, avg_seconds: x.secs, scroll_depth_pct: x.depth, entries: x.entries, exit_rate_pct: x.exitRate }));
  }
  const name = `inda-analytics-${tab}-${r.from.toISOString().slice(0, 10)}-to-${r.to.toISOString().slice(0, 10)}.csv`;
  return new Response(csv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });
}
