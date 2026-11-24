import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { cronAuthorized } from "@/lib/cron";
import { emailButton, emailLayout, escapeHtml, sendEmail } from "@/lib/notify";
import { breakdown, overview, type Range } from "@/lib/analytics-queries";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Monday morning summary of the last 7 days vs the 7 before. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  if (!env.alertEmail) return Response.json({ ok: false, reason: "ALERT_EMAIL not set" });
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 86400_000);
  const r: Range = { key: "7d", from, to, prevFrom: new Date(from.getTime() - 7 * 86400_000), prevTo: from, bucket: "day", label: "7 days" };
  const [o, pages, sources, messages] = await Promise.all([overview(r, {}), breakdown("path", r, {}, 5), breakdown("source", r, {}, 5), db.message.count({ where: { createdAt: { gte: from } } })]);
  const d = (v: number | null) => (v == null || !Number.isFinite(v) ? "" : ` (${v > 0 ? "+" : ""}${v.toFixed(0)}%)`);
  const lines = [
    `Visitors: ${o.cur.visitors}${d(o.delta.visitors)}`,
    `Page views: ${o.cur.pageviews}${d(o.delta.pageviews)}`,
    `Orders: ${o.store.orders}${d(o.delta.orders)}`,
    `Revenue: ${formatMoney(o.store.ngn)}`,
    `Conversion: ${o.conv.toFixed(1)}%`,
    `New messages: ${messages}`,
    "",
    `Top pages: ${pages.map((p) => `${p.key} (${p.value})`).join(", ") || "—"}`,
    `Top sources: ${sources.map((p) => `${p.key} (${p.value})`).join(", ") || "—"}`,
  ];
  await sendEmail({
    to: env.alertEmail,
    subject: `Weekly report: ${o.cur.visitors} visitors, ${o.store.orders} orders`,
    text: lines.join("\n"),
    html: emailLayout("Your week on inda.dev", `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.7;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>${emailButton(`${env.siteUrl}/admin/analytics?range=7d`, "Open analytics")}`),
  });
  return Response.json({ ok: true });
}
