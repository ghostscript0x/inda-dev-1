import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, Check, Reply } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { ActionButton } from "@/components/admin/action-button";
import { Panel } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { setMessageStatus } from "@/app/admin/actions/site";

export const metadata = { title: "Message" };

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.message.findUnique({ where: { id } });
  if (!m) notFound();
  const reply = `mailto:${m.email}?subject=${encodeURIComponent(`Re: your ${m.service.toLowerCase()} enquiry`)}&body=${encodeURIComponent(`Hi ${m.name.split(" ")[0]},\n\n`)}`;
  return (
    <>
      <Link href="/admin/inbox" className="mb-4 inline-flex items-center gap-1.5 text-14 text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Inbox
      </Link>
      <PageHeader
        title={m.name}
        description={`${m.email} · ${formatDate(m.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        actions={
          <>
            <a href={reply} className={buttonClass()}>
              <Reply aria-hidden /> Reply by email
            </a>
            {m.status !== "replied" && (
              <ActionButton variant="outline" action={setMessageStatus.bind(null, m.id, "replied")}>
                <Check aria-hidden /> Mark replied
              </ActionButton>
            )}
            {m.status !== "archived" && (
              <ActionButton variant="ghost" action={setMessageStatus.bind(null, m.id, "archived")}>
                <Archive aria-hidden /> Archive
              </ActionButton>
            )}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <p className="text-16 leading-relaxed whitespace-pre-wrap">{m.body}</p>
        </Panel>
        <Panel title="Details" className="lg:col-span-4">
          <dl className="space-y-3 text-14">
            {[
              ["Needs", m.service],
              ["Budget", m.budget],
              ["Came from", m.source ?? "direct"],
              ["Status", m.status],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.75rem] text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}

