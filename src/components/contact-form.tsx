"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Turnstile, turnstileEnabled } from "@/components/turnstile";
import { track } from "@/components/site/track";
import { BUDGETS, SERVICES } from "@/lib/content";

type Errors = Partial<Record<"name" | "email" | "service" | "budget" | "message" | "form", string>>;

export function ContactForm({ defaultService }: { defaultService?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const started = useRef(false);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  function onStart() {
    if (started.current) return;
    started.current = true;
    track("contact_start");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, string>;
    const next: Errors = {};
    if (!body.name?.trim()) next.name = "Please add your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email ?? "")) next.email = "Please add a valid email.";
    if ((body.message ?? "").trim().length < 10) next.message = "A sentence or two helps me reply properly.";
    if (turnstileEnabled && !token) next.form = "Please wait a moment for the spam check to finish.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      let visitorId: string | null = null;
      try {
        visitorId = localStorage.getItem("inda_vid");
      } catch {
        /* storage blocked */
      }
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, turnstileToken: token, visitorId }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; fields?: Errors };
      if (!res.ok) {
        setErrors({ ...(json.fields ?? {}), form: json.error ?? "Something went wrong. Please email me instead." });
        return;
      }
      track("contact_submit", { service: body.service, budget: body.budget });
      setDone(true);
    } catch {
      setErrors({ form: "Network error. Check your connection, or email me directly." });
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="flex flex-col items-start rounded-xl border border-border bg-surface p-8" role="status">
        <CheckCircle2 className="size-8 text-accent-text" aria-hidden />
        <p className="mt-4 text-24 font-semibold tracking-tight">Message sent.</p>
        <p className="mt-2 text-muted">Thanks. I reply to every message within one working day.</p>
      </div>
    );

  return (
    <form onSubmit={submit} onFocus={onStart} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name" error={errors.name}>
          <Input id="c-name" name="name" autoComplete="name" required maxLength={100} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "c-name-error" : undefined} />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email}>
          <Input id="c-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={200} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "c-email-error" : undefined} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="What do you need?" htmlFor="c-service" error={errors.service}>
          <Select id="c-service" name="service" defaultValue={defaultService && SERVICES.includes(defaultService as (typeof SERVICES)[number]) ? defaultService : SERVICES[0]}>
            {SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Budget" htmlFor="c-budget" error={errors.budget}>
          <Select id="c-budget" name="budget" defaultValue={BUDGETS[BUDGETS.length - 1]}>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Message" htmlFor="c-message" error={errors.message} hint="What are you building, securing or automating? Timeline helps too.">
        <Textarea id="c-message" name="message" rows={6} required maxLength={5000} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "c-message-error" : undefined} />
      </Field>
      {/* Honeypot: real people never see or fill this. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Turnstile onToken={onToken} />
      {errors.form && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-14 text-danger" role="alert">
          {errors.form}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {busy ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
