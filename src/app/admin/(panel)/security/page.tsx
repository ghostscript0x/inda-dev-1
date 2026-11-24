import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/shell";
import { SecurityPanels } from "@/components/admin/security-panels";
import { ButtonLink } from "@/components/ui/button";
import { FileText } from "lucide-react";

export const metadata = { title: "Security" };

export default async function SecurityPage() {
  const session = await requireAdmin();
  const sessions = await db.session.findMany({ where: { userId: session.user.id, verified: true, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } });
  return (
    <>
      <PageHeader
        title="Security"
        description="Password, two-factor sign-in and active sessions. You get an email on every new sign-in."
        actions={
          <ButtonLink href="/admin/audit" variant="outline" size="sm">
            <FileText aria-hidden /> Audit log
          </ButtonLink>
        }
      />
      <SecurityPanels
        totpEnabled={session.user.totpEnabled}
        backupLeft={session.user.backupCodes.length}
        sessions={sessions.map((s) => ({ id: s.id, current: s.id === session.id, country: s.country, ua: s.ua, createdAt: s.createdAt.toISOString(), lastSeenAt: s.lastSeenAt.toISOString() }))}
      />
    </>
  );
}
