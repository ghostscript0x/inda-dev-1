import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/shell";
import { Panel } from "@/components/admin/ui";
import { AnalyticsControls } from "@/components/admin/analytics-controls";
import { AreaChart, BarList, Funnel, Sparkline } from "@/components/admin/charts";
import { FORMATS, type FormatName } from "@/lib/format";
import { Realtime } from "@/components/admin/realtime";
import { Badge } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { cn, formatMoney } from "@/lib/utils";
import {
  breakdown,
  engagement,
  notFoundHits,
  overview,
  pagesTable,
  parseFilters,
  parseRange,
  rate,
  realtime,
  series,
  SERIES_METRICS,
  sourcesTable,
  storeBreakdowns,
  storeFunnel,
  vitals,
  type Dimension,
  type Filters,
  type Range,
  type SeriesMetric,
} from "@/lib/analytics-queries";

export const metadata = { title: "Analytics" };

type SP = Record<string, string | undefined>;

function qs(sp: SP, patch: Record<string, string | null>) {
  const next = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string"));
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) next.delete(k);
    else next.set(k, v);
  }
  return `/admin/analytics?${next}`;
}
const filterBase = (sp: SP, dim: Dimension) => qs(sp, { [`f_${dim}`]: null });

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "overview";
  const range = parseRange(sp);
  const filters = parseFilters(sp);
  const compare = sp.compare !== "0";

  return (
    <>
      <PageHeader title="Analytics" description="Private, cookie-free stats. Bots and your own visits are left out." />
      <Suspense>
        <AnalyticsControls exportable={["pages", "sources", "audience", "store", "engagement", "performance"].includes(tab)} />
      </Suspense>
      {tab === "realtime" ? (
        <Realtime initial={await realtime()} />
      ) : tab === "pages" ? (
        <PagesTab r={range} f={filters} sp={sp} />
      ) : tab === "sources" ? (
        <SourcesTab r={range} f={filters} sp={sp} />
      ) : tab === "audience" ? (
        <AudienceTab r={range} f={filters} sp={sp} />
      ) : tab === "store" ? (
        <StoreTab r={range} sp={sp} />
      ) : tab === "engagement" ? (
        <EngagementTab r={range} f={filters} />
      ) : tab === "performance" ? (
        <PerformanceTab r={range} f={filters} />
      ) : (
        <OverviewTab r={range} f={filters} sp={sp} compare={compare} />
      )}
    </>
  );
}

// ───────── Overview ─────────

async function OverviewTab({ r, f, sp, compare }: { r: Range; f: Filters; sp: SP; compare: boolean }) {
  const metric = (sp.metric && sp.metric in SERIES_METRICS ? sp.metric : "visitors") as SeriesMetric;
  const [o, main, prev, sVisitors, sViews, sSessions, sOrders, sNgn] = await Promise.all([
    overview(r, f),
    series(metric, r, f),
    compare ? series(metric, r, f, "prev") : Promise.resolve(undefined),
    series("visitors", r, f),
    series("pageviews", r, f),
    series("sessions", r, f),
    series("orders", r, f),
    series("revenue_ngn", r, f),
  ]);
  const fmt: Record<SeriesMetric, FormatName> = { visitors: "number", pageviews: "number", sessions: "number", orders: "number", revenue_ngn: "ngn" };

  const cards: { label: string; value: string; delta: number | null; spark?: number[]; metric?: SeriesMetric; invert?: boolean }[] = [
    { label: "Visitors", value: FORMATS.number(o.cur.visitors), delta: o.delta.visitors, spark: sVisitors.map((p) => p.v), metric: "visitors" },
    { label: "Page views", value: FORMATS.number(o.cur.pageviews), delta: o.delta.pageviews, spark: sViews.map((p) => p.v), metric: "pageviews" },
    { label: "Sessions", value: FORMATS.number(o.cur.sessions), delta: o.delta.sessions, spark: sSessions.map((p) => p.v), metric: "sessions" },
    { label: "Bounce rate", value: FORMATS.percent(o.cur.bounceRate), delta: o.delta.bounceRate, invert: true },
    { label: "Avg. session", value: FORMATS.seconds(o.cur.avgSession), delta: o.delta.avgSession },
    { label: "Orders", value: FORMATS.number(o.store.orders), delta: o.delta.orders, spark: sOrders.map((p) => p.v), metric: "orders" },
    { label: "Revenue", value: formatMoney(o.store.ngn), delta: o.delta.ngn, spark: sNgn.map((p) => p.v), metric: "revenue_ngn" },
    { label: "Conversion rate", value: FORMATS.percent(o.conv), delta: o.delta.conv },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const good = c.delta == null ? null : c.invert ? c.delta < 0 : c.delta > 0;
          const body = (
            <>
              <p className="text-[0.8125rem] text-muted">{c.label}</p>
              <p className="mt-1 font-mono text-24 font-medium tracking-tight tabular-nums">{c.value}</p>
              <p className="mt-0.5 h-4 text-[0.75rem]">
                {c.delta != null && Number.isFinite(c.delta) ? (
                  <span className={cn("font-mono", good ? "text-accent-text" : c.delta === 0 ? "text-subtle" : "text-danger")}>
                    {c.delta > 0 ? "+" : ""}
                    {c.delta.toFixed(0)}% <span className="text-subtle">vs previous</span>
                  </span>
                ) : (
                  <span className="text-subtle">no prior data</span>
                )}
              </p>
              {c.spark && <Sparkline data={c.spark} className="mt-2" />}
            </>
          );
          const cls = cn("rounded-xl border bg-surface p-4 transition-colors duration-150", c.metric === metric ? "border-accent-text/50" : "border-border");
          return c.metric ? (
            <Link key={c.label} href={qs(sp, { metric: c.metric })} scroll={false} className={cn(cls, "hover:border-border-strong")} aria-current={c.metric === metric ? "true" : undefined}>
              {body}
            </Link>
          ) : (
            <div key={c.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
      <Panel title={`${SERIES_METRICS[metric]} · ${r.label}`}>
        <AreaChart data={main} compare={prev} bucket={r.bucket} format={fmt[metric]} label={SERIES_METRICS[metric]} />
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top pages">
          <BarList rows={await breakdown("path", r, f)} filterBase={filterBase(sp, "path")} filterParam="f_path" />
        </Panel>
        <Panel title="Top sources">
          <BarList rows={await breakdown("source", r, f)} filterBase={filterBase(sp, "source")} filterParam="f_source" />
        </Panel>
      </div>
      <p className="text-[0.75rem] text-subtle">
        New vs returning: {FORMATS.number(o.cur.newVisitors)} new · {FORMATS.number(Math.max(0, o.cur.visitors - o.cur.newVisitors))} returning · {o.cur.pagesPerSession.toFixed(1)} pages per session
      </p>
    </div>
  );
}

// ───────── Pages ─────────

async function PagesTab({ r, f, sp }: { r: Range; f: Filters; sp: SP }) {
  const [rows, missing] = await Promise.all([pagesTable(r, f), notFoundHits(r)]);
  const sort = (sp.sort as keyof (typeof rows)[number]) ?? "value";
  const sorted = [...rows].sort((a, b) => Number(b[sort] ?? -1) - Number(a[sort] ?? -1));
  const cols: [keyof (typeof rows)[number], string][] = [
    ["value", "Views"],
    ["visitors", "Visitors"],
    ["secs", "Time on page"],
    ["depth", "Scroll depth"],
    ["entries", "Entries"],
    ["exitRate", "Exit rate"],
  ];
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-[0.8125rem]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Page</th>
              {cols.map(([k, label]) => (
                <th key={k} className="px-4 py-2.5 text-right font-medium" aria-sort={sort === k ? "descending" : "none"}>
                  <Link href={qs(sp, { sort: k })} scroll={false} className={cn("hover:text-fg", sort === k && "text-fg")}>
                    {label}
                    {sort === k ? " ↓" : ""}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-sans text-muted">
                  No page views in this period.
                </td>
              </tr>
            )}
            {sorted.map((p) => (
              <tr key={p.key} className="hover:bg-surface/60">
                <td className="max-w-72 truncate px-4 py-2 font-sans">
                  <Link href={qs(sp, { f_path: p.key })} scroll={false} className="hover:underline">
                    {p.key}
                  </Link>
                </td>
                <td className="px-4 py-2 text-right">{p.value}</td>
                <td className="px-4 py-2 text-right">{p.visitors}</td>
                <td className="px-4 py-2 text-right">{p.secs == null ? "—" : FORMATS.seconds(p.secs)}</td>
                <td className="px-4 py-2 text-right">{p.depth == null ? "—" : `${p.depth}%`}</td>
                <td className="px-4 py-2 text-right">{p.entries}</td>
                <td className="px-4 py-2 text-right">{p.exitRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Panel title="404s: broken URLs people hit">
        <BarList rows={missing.map((m) => ({ key: m.key, value: m.value, sub: m.from ? `from ${m.from.replace(/^https?:\/\//, "").slice(0, 40)}` : undefined }))} empty="No broken links hit in this period." />
      </Panel>
    </div>
  );
}

// ───────── Sources ─────────

async function SourcesTab({ r, f, sp }: { r: Range; f: Filters; sp: SP }) {
  const groups: { title: string; dim: "source" | "referrer" | "campaign" | "utm_source" }[] = [
    { title: "Channels", dim: "source" },
    { title: "Referrers", dim: "referrer" },
    { title: "UTM / link-in-bio source", dim: "utm_source" },
    { title: "Campaigns", dim: "campaign" },
  ];
  const data = await Promise.all(groups.map((g) => sourcesTable(g.dim, r, f)));
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {groups.map((g, i) => (
        <Panel key={g.dim} title={g.title}>
          {data[i].length === 0 ? (
            <p className="py-6 text-center text-14 text-muted">No data for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[0.8125rem]">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Source</th>
                    <th className="py-2 text-right font-medium">Visitors</th>
                    <th className="py-2 text-right font-medium">Conv.</th>
                    <th className="py-2 pl-3 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {data[i].slice(0, 20).map((row) => (
                    <tr key={row.key}>
                      <td className="max-w-48 truncate py-2 pr-3 font-sans">
                        <Link href={qs(sp, { [`f_${g.dim}`]: row.key })} scroll={false} className="hover:underline">
                          {row.key}
                        </Link>
                      </td>
                      <td className="py-2 text-right">{row.value}</td>
                      <td className="py-2 text-right">{row.conv}%</td>
                      <td className="py-2 pl-3 text-right whitespace-nowrap">{row.ngn ? formatMoney(row.ngn) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

// ───────── Audience ─────────

async function AudienceTab({ r, f, sp }: { r: Range; f: Filters; sp: SP }) {
  const [countries, cities, devices, browsers, os, screens, langs, themes] = await Promise.all([
    breakdown("country", r, f),
    breakdown("city", r, f),
    breakdown("device", r, f),
    breakdown("browser", r, f),
    breakdown("os", r, f),
    breakdown("screen", r, f, 20),
    breakdown("lang", r, f, 20),
    breakdown("theme", r, f, 5),
  ]);
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const countryName = (c: string) => {
    try {
      return c.length === 2 ? `${names.of(c)} (${c})` : c;
    } catch {
      return c;
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Countries">
        <BarList rows={countries.map((c) => ({ ...c, key: c.key, sub: countryName(c.key) === c.key ? undefined : countryName(c.key).replace(/ \(..\)$/, "") }))} filterBase={filterBase(sp, "country")} filterParam="f_country" max={15} />
      </Panel>
      <Panel title="Cities">
        <BarList rows={cities} filterBase={filterBase(sp, "city")} filterParam="f_city" max={15} />
      </Panel>
      <Panel title="Devices">
        <BarList rows={devices} filterBase={filterBase(sp, "device")} filterParam="f_device" />
      </Panel>
      <Panel title="Browsers">
        <BarList rows={browsers} filterBase={filterBase(sp, "browser")} filterParam="f_browser" />
      </Panel>
      <Panel title="Operating systems">
        <BarList rows={os} filterBase={filterBase(sp, "os")} filterParam="f_os" />
      </Panel>
      <Panel title="Screen sizes">
        <BarList rows={screens} />
      </Panel>
      <Panel title="Languages">
        <BarList rows={langs} />
      </Panel>
      <Panel title="Theme">
        <BarList rows={themes} />
      </Panel>
    </div>
  );
}

// ───────── Store ─────────

async function StoreTab({ r, sp }: { r: Range; sp: SP }) {
  const productId = sp.product;
  const [funnel, b, products, ngn] = await Promise.all([
    storeFunnel(r, productId),
    storeBreakdowns(r),
    db.product.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    series("revenue_ngn", r, {}),
  ]);
  const money = (x: { ngn: number }) => (x.ngn ? formatMoney(x.ngn) : "—");
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <Panel
          title="Funnel"
          className="lg:col-span-7"
          action={
            <div className="flex flex-wrap gap-1">
              <Link href={qs(sp, { product: null })} scroll={false} className={cn("rounded-md px-2 py-1 text-[0.75rem]", !productId ? "bg-surface-2 text-fg" : "text-muted")}>
                All
              </Link>
              {products.slice(0, 6).map((p) => (
                <Link key={p.id} href={qs(sp, { product: p.id })} scroll={false} className={cn("max-w-32 truncate rounded-md px-2 py-1 text-[0.75rem]", productId === p.id ? "bg-surface-2 text-fg" : "text-muted")}>
                  {p.title}
                </Link>
              ))}
            </div>
          }
        >
          <Funnel steps={funnel.steps} />
          <p className="mt-4 text-[0.75rem] text-subtle">{funnel.abandoned} abandoned or failed checkouts in this period.</p>
        </Panel>
        <Panel title="Top products" className="lg:col-span-5">
          {b.products.length === 0 ? (
            <p className="py-6 text-center text-14 text-muted">No sales in this period.</p>
          ) : (
            <ul className="divide-y divide-border text-[0.8125rem]">
              {b.products.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate">{p.key}</span>
                    <span className="font-mono text-[0.75rem] text-subtle">
                      {p.value} orders · {p.conv}% of viewers bought
                    </span>
                  </span>
                  <span className="shrink-0 font-mono">{money(p)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title="Revenue">
        <AreaChart data={ngn} bucket={r.bucket} format="ngn" label="Revenue" height={220} />
      </Panel>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Revenue by source">
          <BarList rows={b.sources.map((s) => ({ key: s.key, value: s.value, sub: money(s) }))} empty="No sales yet." />
        </Panel>
        <Panel title="Revenue by country">
          <BarList rows={b.countries.map((s) => ({ key: s.key, value: s.value, sub: money(s) }))} empty="No sales yet." />
        </Panel>
        <Panel title="Coupon use">
          <BarList rows={b.coupons} empty="No coupons used." />
        </Panel>
      </div>
    </div>
  );
}

// ───────── Engagement ─────────

async function EngagementTab({ r, f }: { r: Range; f: Filters }) {
  const e = await engagement(r, f);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="CTA & button clicks">
        <BarList rows={e.clicks} max={15} />
      </Panel>
      <Panel title="Contact channels">
        <BarList rows={e.channels} />
      </Panel>
      <Panel title="Social link clicks">
        <BarList rows={e.social} empty="No social clicks yet." />
      </Panel>
      <Panel title="Contact form">
        <Funnel steps={e.contactFunnel} />
      </Panel>
      <Panel title="Scroll depth (page views reaching…)">
        <BarList rows={e.depth} />
      </Panel>
      <Panel title="⌘K searches">
        <BarList rows={e.searches} empty="No searches yet." max={15} />
      </Panel>
      <Panel title="Leads by service and budget" className="lg:col-span-2">
        <BarList rows={e.leads} empty="No messages in this period." />
      </Panel>
    </div>
  );
}

// ───────── Performance ─────────

function VitalCell({ metric, v }: { metric: "lcp" | "inp" | "cls" | "ttfb"; v: number | null }) {
  const r = rate(metric, v);
  if (v == null || !r) return <td className="px-4 py-2 text-right text-subtle">—</td>;
  const shown = metric === "cls" ? v.toFixed(2) : `${Math.round(v)} ms`;
  return (
    <td className="px-4 py-2 text-right">
      <span className="inline-flex items-center gap-2">
        {shown}
        <Badge tone={r === "good" ? "accent" : r === "needs work" ? "warning" : "danger"}>{r === "good" ? "✓ good" : r === "needs work" ? "! needs work" : "✕ poor"}</Badge>
      </span>
    </td>
  );
}

async function PerformanceTab({ r, f }: { r: Range; f: Filters }) {
  const rows = await vitals(r, f);
  return (
    <div className="space-y-4">
      <p className="text-14 text-muted">Real-user Core Web Vitals at the 75th percentile, split by phone vs desktop. Targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, TTFB ≤ 800ms.</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-left text-[0.8125rem]">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Page</th>
              <th className="px-4 py-2.5 font-medium">Device</th>
              <th className="px-4 py-2.5 text-right font-medium">Samples</th>
              <th className="px-4 py-2.5 text-right font-medium">LCP</th>
              <th className="px-4 py-2.5 text-right font-medium">INP</th>
              <th className="px-4 py-2.5 text-right font-medium">CLS</th>
              <th className="px-4 py-2.5 text-right font-medium">TTFB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-sans text-muted">
                  No Web Vitals collected in this period yet.
                </td>
              </tr>
            )}
            {rows.map((v) => (
              <tr key={`${v.path}-${v.device}`}>
                <td className="max-w-64 truncate px-4 py-2 font-sans">{v.path}</td>
                <td className="px-4 py-2 font-sans">{v.device}</td>
                <td className="px-4 py-2 text-right">{v.samples}</td>
                <VitalCell metric="lcp" v={v.lcp} />
                <VitalCell metric="inp" v={v.inp} />
                <VitalCell metric="cls" v={v.cls} />
                <VitalCell metric="ttfb" v={v.ttfb} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
