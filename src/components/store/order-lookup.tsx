"use client";

import { useCallback, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Turnstile, turnstileEnabled } from "@/components/turnstile";

export function OrderLookup() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (turnstileEnabled && !token) return setError("Please wait a moment for the spam check to finish.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/lookup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, turnstileToken: token }) });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="mt-8 rounded-xl border border-border bg-surface p-6" role="status">
        <MailCheck className="size-6 text-accent-text" aria-hidden />
        <p className="mt-3 font-medium">Check your inbox</p>
        <p className="mt-1 text-14 text-muted">If {email} has orders, fresh links are on the way. They can take a minute to arrive.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <Field label="Email" htmlFor="lookup-email">
        <Input id="lookup-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Turnstile onToken={onToken} onError={setError} />
      {error && (
        <p className="text-14 text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy}>
        {busy && <Loader2 className="animate-spin" aria-hidden />} Email my links
      </Button>
    </form>
  );
}
