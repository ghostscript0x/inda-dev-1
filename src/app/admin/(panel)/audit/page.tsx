import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { Empty } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Audit log" };

const PAGE = 100;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const p = Math.max(1, Number((await searchParams).page) || 1);
  const [logs, total] = await Promise.all([db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: PAGE, skip: (p - 1) * PAGE, include: { user: { select: { email: true } } } }), db.auditLog.count()]);
  return (
    <>
      <PageHeader title="Audit log" description="Every change and sign-in attempt, newest first." />
      {logs.length === 0 ? (
        <Empty title="Nothing logged yet" />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border font-mono text-[0.8125rem]">
          {logs.map((l) => (
            <li key={l.id} className="flex flex-col gap-1 px-4 py-2.5 md:flex-row md:items-center md:gap-4">
              <span className="w-40 shrink-0 text-subtle">{formatDate(l.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              <span className={l.action.includes("fail") || l.action.includes("lock") ? "text-danger" : "text-accent-text"}>{l.action}</span>
              <span className="min-w-0 flex-1 truncate text-muted">
                {l.target ?? ""} {l.meta ? JSON.stringify(l.meta) : ""}
              </span>
              <span className="truncate text-subtle">{l.user?.email ?? "system"}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-4 text-14">
        {p > 1 && (
          <Link className="link" href={`/admin/audit?page=${p - 1}`}>
            Newer
          </Link>
        )}
        {p * PAGE < total && (
          <Link className="link" href={`/admin/audit?page=${p + 1}`}>
            Older
          </Link>
        )}
      </div>
    </>
  );
}
