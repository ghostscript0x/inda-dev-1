import { AuthCard } from "@/components/admin/auth-card";
import { EnrollForm } from "@/components/admin/enroll-form";
import { env } from "@/lib/env";
import { getEnrollment } from "../../actions/auth";

export const dynamic = "force-dynamic";

export default async function SetupTwoFactorPage() {
  // The 2FA secret is encrypted with AUTH_SECRET; without it enrollment can't work, so say so plainly.
  if (!env.authSecret)
    return (
      <AuthCard title="One setting is missing" text="Two-factor setup needs AUTH_SECRET, and it isn't set on this server.">
        <ol className="list-decimal space-y-2 pl-5 text-14 text-muted">
          <li>
            In your host (Vercel → Settings → Environment Variables), add <code className="font-mono text-fg">AUTH_SECRET</code> with a long random value.
          </li>
          <li>Redeploy, then sign in again.</li>
        </ol>
      </AuthCard>
    );
  const { qr, secret } = await getEnrollment();
  return (
    <AuthCard title="Set up two-factor authentication" text="Required for every admin account. Scan the code with an authenticator app (1Password, Google Authenticator, Authy…), then enter the 6-digit code.">
      <EnrollForm qr={qr} secret={secret} />
    </AuthCard>
  );
}
