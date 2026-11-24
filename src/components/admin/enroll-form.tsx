"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormMessage, Submit } from "@/components/admin/submit";
import { Field, Input } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { confirmEnrollmentAction } from "@/app/admin/actions/auth";

export function EnrollForm({ qr, secret }: { qr: string; secret: string }) {
  const [state, action] = useActionState(confirmEnrollmentAction, undefined);

  if (state?.codes)
    return (
      <div>
        <p className="text-14 text-muted">2FA is on. Save these backup codes somewhere safe (a password manager). Each one works once if you lose your phone. They won’t be shown again.</p>
        <ul className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-4 font-mono text-14">
          {state.codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <Link href="/admin" className={buttonClass({ size: "lg" }, "mt-6 w-full")}>
          I saved them, continue
        </Link>
      </div>
    );

  return (
    <form action={action} className="space-y-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL QR code */}
      <img src={qr} alt="QR code for your authenticator app" width={220} height={220} className="mx-auto rounded-lg" />
      <details className="text-14 text-muted">
        <summary className="cursor-pointer">Can’t scan? Enter the key manually</summary>
        <code className="mt-2 block rounded-md bg-surface-2 p-2 font-mono text-[0.75rem] break-all text-fg">{secret}</code>
      </details>
      <Field label="6-digit code" htmlFor="code">
        <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} className="text-center font-mono text-24 tracking-[0.3em]" />
      </Field>
      <FormMessage state={state} />
      <Submit className="w-full" size="lg">
        Turn on 2FA
      </Submit>
    </form>
  );
}
