import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { FilterLinks, statusLabel, statusTone } from "@/components/admin/ui";
import { ListSearch } from "@/components/admin/list-search";
import { Badge, Empty } from "@/components/ui/misc";
import { cn, timeAgo } from "@/lib/utils";

export const metadata = { title: "Inbox" };

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const [messages, counts] = await Promise.all([
    db.message.findMany({
      where: {
        status: status || { not: "archived" },
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.message.groupBy({ by: ["status"], _count: true }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  return (
    <>
      <PageHeader title="Inbox" description="Messages from the contact form." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterLinks
          base="/admin/inbox"
          param="status"
          current={status}
          options={[
            { value: "", label: "Open" },
            { value: "new", label: "New", count: c("new") },
            { value: "replied", label: "Replied", count: c("replied") },
            { value: "archived", label: "Archived", count: c("archived") },
          ]}
        />
        <ListSearch placeholder="Search messages" />
      </div>
      {messages.length === 0 ? (
        <Empty title="Inbox zero" />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {messages.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/inbox/${m.id}`} className="flex flex-col gap-1 p-4 transition-colors duration-150 hover:bg-surface/60 md:flex-row md:items-center md:gap-4">
                <span className={cn("w-44 shrink-0 truncate", m.status === "new" && "font-semibold")}>{m.name}</span>
                <span className="min-w-0 flex-1 truncate text-14 text-muted">
                  <span className="text-fg">{m.service}</span> · {m.budget} · {m.body}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Badge tone={statusTone(m.status)}>{statusLabel(m.status)}</Badge>
                  <span className="w-16 text-right font-mono text-[0.75rem] text-subtle">{timeAgo(m.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
