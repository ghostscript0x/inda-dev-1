"use client";

import { useActionState } from "react";
import { AuthCard } from "@/components/admin/auth-card";
import { FormMessage, Submit } from "@/components/admin/submit";
import { Field, Input } from "@/components/ui/field";
import { logoutAction, verify2faAction } from "../../actions/auth";

export default function TwoFactorPage() {
  const [state, action] = useActionState(verify2faAction, undefined);
  return (
    <AuthCard title="Two-factor authentication" text="Enter the 6-digit code from your authenticator app, or a backup code.">
      <form action={action} className="space-y-5">
        <Field label="Code" htmlFor="code">
          <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required autoFocus maxLength={11} className="text-center font-mono text-24 tracking-[0.3em]" />
        </Field>
        <FormMessage state={state} />
        <Submit className="w-full" size="lg">
          Verify
        </Submit>
      </form>
      <form action={logoutAction} className="mt-4">
        <button type="submit" className="text-14 text-muted hover:text-fg">
          Use a different account
        </button>
      </form>
    </AuthCard>
  );
}
