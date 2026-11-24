"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Loader2, Lock, MailCheck, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { Turnstile, turnstileEnabled } from "@/components/turnstile";
import { track } from "@/components/site/track";
import { Price } from "./price";
import { cn } from "@/lib/utils";

type Props = { productId: string; title: string; priceNGN: number; isFree: boolean; className?: string; label?: string; size?: "md" | "lg" };

export function BuyButton({ productId, title, priceNGN, isFree, className, label, size = "lg" }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agreed) return setError("Please accept the Terms, Refund policy and License.");
    if (turnstileEnabled && !token) return setError("Please wait a moment for the spam check to finish.");
    setBusy(true);
    try {
      let visitorId: string | null = null;
      try {
        visitorId = localStorage.getItem("inda_vid");
      } catch {
        /* storage blocked */
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, email, coupon: coupon.trim() || undefined, termsAccepted: true, turnstileToken: token, visitorId }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; confirm?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Checkout failed. Please try again.");
      if (json.confirm) {
        setConfirmSent(true);
        return;
      }
      if (!json.url) throw new Error("Checkout failed. Please try again.");
      window.location.assign(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) track("buy_click", { productId, product: title });
        if (!o) {
          setBusy(false);
          setConfirmSent(false);
        }
      }}
    >
      <Dialog.Trigger className={cn(buttonClass({ size }), "w-full", className)}>{label ?? (isFree ? "Get it free" : "Buy now")}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl border border-border-strong bg-surface p-6 shadow-2xl sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-18 font-semibold tracking-tight">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-14 text-muted">
                <Price ngn={priceNGN} isFree={isFree} className="text-fg" /> · instant download, no account needed
              </Dialog.Description>
            </div>
            <Dialog.Close className={buttonClass({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
              <X />
            </Dialog.Close>
          </div>

          {confirmSent ? (
            <div className="mt-8 flex flex-col items-center py-6 text-center">
              <MailCheck className="size-10 text-accent-text" aria-hidden />
              <p className="mt-4 font-medium">Check your inbox</p>
              <p className="mt-1.5 text-14 text-muted">We sent a confirmation link to {email}. Click it and your download starts.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
              <Field label="Email" htmlFor="buy-email" hint="Your download link is sent here.">
                <Input id="buy-email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              {!isFree &&
                (showCoupon ? (
                  <Field label="Coupon code" htmlFor="buy-coupon">
                    <Input id="buy-coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} autoComplete="off" className="font-mono uppercase" maxLength={40} />
                  </Field>
                ) : (
                  <button type="button" className="text-14 text-accent-text hover:underline" onClick={() => setShowCoupon(true)}>
                    Have a coupon?
                  </button>
                ))}
              <label className="flex items-start gap-3 text-14 text-muted">
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="link">
                    Terms
                  </Link>
                  ,{" "}
                  <Link href="/refunds" target="_blank" className="link">
                    Refund policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/license" target="_blank" className="link">
                    License
                  </Link>
                  .
                </span>
              </label>
              <Turnstile onToken={onToken} onError={setError} />
              {error && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-14 text-danger" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
                {busy ? "Starting checkout…" : isFree ? "Send me the download" : "Continue to secure payment"}
              </Button>
              {!isFree && <p className="text-center text-[0.8125rem] text-subtle">Payments are processed by Paystack. Cards, bank transfer and USSD accepted.</p>}
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
