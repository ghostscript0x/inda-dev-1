"use client";

import { useState } from "react";
import { KeyRound, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { Panel } from "./ui";
import { useRun } from "./product-row-actions";
import { changePassword, regenerateBackupCodes, revokeOtherSessions, revokeSession } from "@/app/admin/actions/site";

type SessionRow = { id: string; current: boolean; country: string | null; ua: string | null; createdAt: string; lastSeenAt: string };

export function SecurityPanels({ sessions, backupLeft, totpEnabled }: { sessions: SessionRow[]; backupLeft: number; totpEnabled: boolean }) {
  const { run, pending } = useRun();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Two-factor authentication" action={<Badge tone={totpEnabled ? "accent" : "danger"}>{totpEnabled ? "on" : "off"}</Badge>}>
        <p className="text-14 text-muted">Authenticator-app codes are required at every sign-in. You have {backupLeft} unused backup code{backupLeft === 1 ? "" : "s"}.</p>
        {codes ? (
          <div className="mt-4">
            <p className="text-14">Save these now. They won’t be shown again.</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg p-3 font-mono text-14">
              {codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : (
          <Button variant="outline" className="mt-4" disabled={pending} onClick={() => confirm("Create new backup codes? The old ones stop working.") && run(() => regenerateBackupCodes(), (d) => d && setCodes(d))}>
            <RefreshCw aria-hidden /> New backup codes
          </Button>
        )}
      </Panel>

      <Panel title="Change password">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => changePassword({ current, next }),
              () => {
                setCurrent("");
                setNext("");
              },
            );
          }}
        >
          <Field label="Current password" htmlFor="pw-cur">
            <PasswordInput id="pw-cur" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label="New password" htmlFor="pw-new" hint="At least 12 characters. A passphrase works well.">
            <PasswordInput id="pw-new" autoComplete="new-password" minLength={12} value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={pending}>
            <KeyRound aria-hidden /> Change password
          </Button>
        </form>
      </Panel>

      <Panel
        title="Active sessions"
        className="xl:col-span-2"
        action={
          sessions.length > 1 && (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => revokeOtherSessions())}>
              <LogOut aria-hidden /> Sign out all others
            </Button>
          )
        }
      >
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-14">
                  {s.ua ?? "Unknown device"} {s.current && <Badge tone="accent">this device</Badge>}
                </p>
                <p className="font-mono text-[0.75rem] text-subtle">
                  {s.country ?? "Unknown country"} · signed in {formatDate(s.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · last active {formatDate(s.lastSeenAt, { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!s.current && (
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => revokeSession(s.id))}>
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
