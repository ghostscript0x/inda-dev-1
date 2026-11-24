"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonStyle } from "@/components/ui/button";

export function Submit({ children, className, ...style }: { children: React.ReactNode; className?: string } & ButtonStyle) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className} {...style}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (state?.error)
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-14 text-danger" role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className="rounded-lg border border-accent-text/30 bg-accent-soft px-3 py-2 text-14 text-accent-text" role="status">
        {state.ok}
      </p>
    );
  return null;
}
