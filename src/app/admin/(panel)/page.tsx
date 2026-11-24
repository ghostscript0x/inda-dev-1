import Link from "next/link";
import { ArrowRight, Check, Circle, FileWarning, Inbox, MessageSquare, Plus, Receipt, Star, TriangleAlert } from "lucide-react";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { PageHeader } from "@/components/admin/shell";
import { Panel, Stat, statusLabel, statusTone } from "@/components/admin/ui";
import { AreaChart, BarList } from "@/components/admin/charts";
import { Badge } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { FORMATS } from "@/lib/format";
import { breakdown, overview, parseRange, series } from "@/lib/analytics-queries";
import { cn, formatMoney } from "@/lib/utils";

export const metadata = { title: "Overview" };

const LAGOS = "Africa/Lagos";

function greeting(now: Date) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: LAGOS }).format(now));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function ago(d: Date, now: Date) {
  const s = Math.max(0, (now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: LAGOS }).format(d);
}

export default async function Overview() {
  const now = new Date();
  const r = parseRange({ range: "30d" });
  const [o, visitors, sRevenue, sOrders, pages, sources, settings, orders, messages, live, attention, setup] = await Promise.all([
    overview(r, {}),
    series("visitors", r, {}),
    series("revenue_ngn", r, {}),
    series("orders", r, {}),
    breakdown("path", r, {}, 6),
    breakdown("source", r, {}, 6),
    db.siteSettings.findUnique({ where: { id: 1 }, select: { name: true, cvFileId: true } }),
    db.order.findMany({ where: { status: { in: ["paid", "refunded", "failed"] } }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, email: true, amount: true, status: true, createdAt: true, product: { select: { title: true } } } }),
    db.message.findMany({ where: { status: "new" }, orderBy: { createdAt: "desc" }, take: 4, select: { id: true, name: true, service: true, body: true, createdAt: true } }),
    db.$queryRaw<{ c: bigint }[]>`SELECT COUNT(DISTINCT "visitorId") AS c FROM "Event" WHERE ts >= ${new Date(now.getTime() - 5 * 60_000)} AND "sessionId" NOT LIKE 'srv_%'`,
    Promise.all([
      db.message.count({ where: { status: "new" } }),
      db.review.count({ where: { approved: false } }),
      db.product.count({ where: { status: "published", fileId: null } }),
      db.product.count({ where: { status: "draft" } }),
      db.order.count({ where: { status: "failed", createdAt: { gte: new Date(now.getTime() - 7 * 86400_000) } } }),
    ]),
    Promise.all([db.product.count({ where: { status: "published" } }), db.project.count({ where: { published: true } })]),
  ]);

  const [unread, pendingReviews, noFile, drafts, failed] = attention;
  const [liveProducts, liveProjects] = setup;
  const firstName = settings?.name.split(/\s+/)[0] ?? "";
  const liveNow = Number(live[0]?.c ?? 0);

  const tasks = [
    { done: Boolean(env.paystackSecret), label: "Connect Paystack", hint: "PAYSTACK_SECRET_KEY in .env" },
    { done: Boolean(env.resendKey), label: "Set up email", hint: "RESEND_API_KEY in .env" },
    { done: env.cloudinary, label: "Set up file storage", hint: "CLOUDINARY_URL in .env" },
    { done: Boolean(env.turnstileSecret), label: "Turn on spam protection", hint: "Turnstile keys in .env" },
    { done: liveProducts > 0, label: "Publish your first product", href: "/admin/products/new" },
    { done: liveProjects > 0, label: "Publish a case study", href: "/admin/work" },
    { done: Boolean(settings?.cvFileId), label: "Upload your CV", href: "/admin/settings" },
  ];
  const doneCount = tasks.filter((t) => t.done).length;

  const todo = [
    unread && { href: "/admin/inbox", icon: MessageSquare, text: `${unread} unread ${unread === 1 ? "message" : "messages"}`, tone: "accent" },
    pendingReviews && { href: "/admin/reviews", icon: Star, text: `${pendingReviews} ${pendingReviews === 1 ? "review" : "reviews"} to approve`, tone: "default" },
    noFile && { href: "/admin/products", icon: FileWarning, text: `${noFile} live ${noFile === 1 ? "product has" : "products have"} no file`, tone: "danger" },
    failed && { href: "/admin/orders?status=failed", icon: TriangleAlert, text: `${failed} failed ${failed === 1 ? "payment" : "payments"} this week`, tone: "warning" },
    drafts && { href: "/admin/products?status=draft", icon: Circle, text: `${drafts} draft ${drafts === 1 ? "product" : "products"}`, tone: "default" },
  ].filter(Boolean) as { href: string; icon: typeof Inbox; text: string; tone: string }[];

  return (
    <>
      <PageHeader
        title={`${greeting(now)}${firstName ? `, ${firstName}` : ""}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: LAGOS }).format(now)}
            <Link href="/admin/analytics?tab=realtime" className="inline-flex items-center gap-1.5 text-subtle hover:text-fg">
              <span className={cn("size-1.5 rounded-full", liveNow ? "animate-pulse bg-accent" : "bg-subtle")} aria-hidden />
              {liveNow} on the site now
            </Link>
          </span>
        }
        actions={
          <ButtonLink href="/admin/products/new">
            <Plus aria-hidden /> New product
          </ButtonLink>
        }
      />

      {doneCount < tasks.length && (
        <Panel
          className="mb-6"
          title="Finish setting up"
          description={`${doneCount} of ${tasks.length} done. These make the store work in production.`}
          action={
            <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={tasks.length} aria-label="Setup progress">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
            </div>
          }
        >
          <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => {
              const body = (
                <>
                  <span className={cn("flex size-4.5 shrink-0 items-center justify-center rounded-full border", t.done ? "border-accent-text bg-accent-text text-bg" : "border-border-strong")}>{t.done && <Check className="size-3" strokeWidth={3} aria-hidden />}</span>
                  <span className={cn("min-w-0 flex-1 truncate", t.done && "text-subtle line-through decoration-border-strong")}>{t.label}</span>
                  {!t.done && (t.href ? <ArrowRight className="size-3.5 shrink-0 text-subtle" aria-hidden /> : <span className="shrink-0 font-mono text-[0.6875rem] text-subtle">{t.hint}</span>)}
                </>
              );
              const cls = "flex h-9 items-center gap-2.5 rounded-md px-1 text-[0.8125rem]";
              return (
                <li key={t.label}>
                  {t.href && !t.done ? (
                    <Link href={t.href} className={cn(cls, "hover:bg-surface-2/60")}>
                      {body}
                    </Link>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue · 30 days" value={formatMoney(o.store.ngn)} delta={o.delta.ngn} spark={sRevenue.map((p) => p.v)} href="/admin/analytics?tab=store" />
        <Stat label="Orders · 30 days" value={FORMATS.number(o.store.orders)} delta={o.delta.orders} spark={sOrders.map((p) => p.v)} href="/admin/orders" />
        <Stat label="Visitors · 30 days" value={FORMATS.number(o.cur.visitors)} delta={o.delta.visitors} spark={visitors.map((p) => p.v)} href="/admin/analytics" />
        <Stat label="Conversion" value={FORMATS.percent(o.conv)} delta={o.delta.conv} sub="visitors who bought" href="/admin/analytics?tab=store" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Visitors"
          description="Last 30 days"
          action={
            <Link href="/admin/analytics" className="text-[0.8125rem] text-muted hover:text-fg">
              Analytics →
            </Link>
          }
        >
          <AreaChart data={visitors} bucket={r.bucket} label="Visitors" height={220} />
        </Panel>

        <Panel title="Needs attention" flush>
          {todo.length ? (
            <ul className="divide-y divide-border border-t border-border">
              {todo.map((t) => (
                <li key={t.href + t.text}>
                  <Link href={t.href} className="flex h-12 items-center gap-3 px-4 text-[0.8125rem] transition-colors hover:bg-surface-2/40 md:px-5">
                    <t.icon className={cn("size-4 shrink-0", t.tone === "accent" ? "text-accent-text" : t.tone === "danger" ? "text-danger" : t.tone === "warning" ? "text-warning" : "text-subtle")} aria-hidden />
                    <span className="flex-1">{t.text}</span>
                    <ArrowRight className="size-3.5 text-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-5 pt-6 pb-8 text-center">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-text">
                <Check className="size-4" aria-hidden />
              </span>
              <p className="mt-3 text-14 font-medium">All clear</p>
              <p className="mt-0.5 text-[0.8125rem] text-subtle">Nothing is waiting on you.</p>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Latest orders"
          flush
          action={
            <Link href="/admin/orders" className="text-[0.8125rem] text-muted hover:text-fg">
              All orders →
            </Link>
          }
        >
          {orders.length ? (
            <ul className="divide-y divide-border border-t border-border">
              {orders.map((x) => (
                <li key={x.id}>
                  <Link href={`/admin/orders/${x.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/40 md:px-5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-subtle">
                      <Receipt className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium">{x.product.title}</span>
                      <span className="block truncate text-[0.75rem] text-subtle">
                        {x.email} · {ago(x.createdAt, now)}
                      </span>
                    </span>
                    <Badge tone={statusTone(x.status)} className="max-sm:hidden">
                      {statusLabel(x.status)}
                    </Badge>
                    <span className="w-24 shrink-0 text-right font-mono text-[0.8125rem] tabular-nums">{x.amount ? formatMoney(x.amount) : "Free"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-border px-5 py-10 text-center text-[0.8125rem] text-subtle">No orders yet. They’ll show up here the moment someone buys.</p>
          )}
        </Panel>

        <Panel
          title="Inbox"
          flush
          action={
            <Link href="/admin/inbox" className="text-[0.8125rem] text-muted hover:text-fg">
              Open →
            </Link>
          }
        >
          {messages.length ? (
            <ul className="divide-y divide-border border-t border-border">
              {messages.map((m) => (
                <li key={m.id}>
                  <Link href={`/admin/inbox/${m.id}`} className="block px-4 py-3 transition-colors hover:bg-surface-2/40 md:px-5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[0.8125rem] font-medium">{m.name}</span>
                      <span className="shrink-0 text-[0.6875rem] text-subtle">{ago(m.createdAt, now)}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[0.75rem] text-muted">
                      <span className="text-subtle">{m.service} · </span>
                      {m.body}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-border px-5 py-10 text-center text-[0.8125rem] text-subtle">No unread messages.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Panel title="Top pages" description="Visitors, last 30 days">
          <BarList rows={pages} empty="No visits yet." max={6} />
        </Panel>
        <Panel title="Where visitors come from" description="Last 30 days">
          <BarList rows={sources} empty="No visits yet." max={6} />
        </Panel>
      </div>
    </>
  );
}
