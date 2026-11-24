import { AuthCard } from "@/components/admin/auth-card";
import { EnrollForm } from "@/components/admin/enroll-form";
import { getEnrollment } from "../../actions/auth";

export const dynamic = "force-dynamic";

export default async function SetupTwoFactorPage() {
  const { qr, secret } = await getEnrollment();
  return (
    <AuthCard title="Set up two-factor authentication" text="Required for every admin account. Scan the code with an authenticator app (1Password, Google Authenticator, Authy…), then enter the 6-digit code.">
      <EnrollForm qr={qr} secret={secret} />
    </AuthCard>
  );
}
