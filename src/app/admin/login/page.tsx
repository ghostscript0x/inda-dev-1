"use client";

import { useActionState, useState } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { FormMessage, Submit } from "@/components/admin/submit";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { loginAction, requestLoginCodeAction, verifyLoginCodeAction } from "../actions/auth";

type Mode = "password" | "code";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  return (
    <AuthCard title="Sign in" text="Welcome back. Sign in to manage the site and store.">
      <div role="tablist" aria-label="Sign-in method" className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border p-1">
        {(
          [
            ["password", "Password"],
            ["code", "Email code"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("h-8 rounded-md text-14 font-medium transition-colors duration-150", mode === m ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "password" ? <PasswordForm /> : <CodeForm />}
    </AuthCard>
  );
}

function PasswordForm() {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <FormMessage state={state} />
      <Submit className="w-full" size="lg">
        Continue
      </Submit>
    </form>
  );
}

function CodeForm() {
  const [requested, request] = useActionState(requestLoginCodeAction, undefined);
  if (requested?.ok && requested.email) return <VerifyStep key={requested.sentAt} email={requested.email} notice={requested.ok} request={request} />;
  return (
    <form action={request} className="space-y-5">
      <Field label="Email" htmlFor="code-email" hint="We’ll email you a 6-digit code. Your authenticator app is still needed after it.">
        <Input id="code-email" name="email" type="email" autoComplete="username" required autoFocus defaultValue={requested?.email} />
      </Field>
      <FormMessage state={requested} />
      <Submit className="w-full" size="lg">
        Email me a code
      </Submit>
    </form>
  );
}

/** Step 2. Re-mounted (fresh state) every time a new code is sent. */
function VerifyStep({ email, notice, request }: { email: string; notice: string; request: (form: FormData) => void }) {
  const [verified, verify] = useActionState(verifyLoginCodeAction, undefined);
  return (
    <div className="space-y-5">
      <form action={verify} className="space-y-5">
        <input type="hidden" name="email" value={email} />
        <FormMessage state={verified ?? { ok: notice }} />
        <Field label="6-digit code" htmlFor="code">
          <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus className="font-mono tracking-[0.3em]" />
        </Field>
        <Submit className="w-full" size="lg">
          Sign in
        </Submit>
      </form>
      <form action={request} className="text-center">
        <input type="hidden" name="email" value={email} />
        <button type="submit" className="text-14 text-muted underline-offset-4 hover:text-fg hover:underline">
          Send a new code
        </button>
      </form>
    </div>
  );
}
