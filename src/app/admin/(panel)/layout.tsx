import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const unread = await db.message.count({ where: { status: "new" } });
  return (
    <AdminShell email={session.user.email} isDemo={session.user.isDemo} unread={unread}>
      {children}
    </AdminShell>
  );
}
