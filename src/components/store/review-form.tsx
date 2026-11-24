"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function ReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, rating, name: fd.get("name"), comment: fd.get("comment") }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not save your review.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your review.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="mt-3 text-muted">Thanks! Your review will appear once approved.</p>;

  return (
    <form onSubmit={submit} className="mt-5 space-y-5">
      <fieldset>
        <legend className="mb-1.5 text-14 font-medium">Rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="flex size-11 items-center justify-center rounded-md hover:bg-surface-2">
              <Star className={cn("size-5", n <= rating ? "fill-accent-text text-accent-text" : "text-border-strong")} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="Name shown with your review" htmlFor="r-name">
        <Input id="r-name" name="name" required maxLength={60} autoComplete="name" />
      </Field>
      <Field label="Your review" htmlFor="r-comment">
        <Textarea id="r-comment" name="comment" required minLength={10} maxLength={1500} />
      </Field>
      {error && (
        <p className="text-14 text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" aria-hidden />} Submit review
      </Button>
    </form>
  );
}
