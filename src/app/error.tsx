"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="container-page flex min-h-[70vh] flex-col justify-center py-24">
      <p className="font-mono text-14 text-danger">Error</p>
      <h1 className="mt-3 text-40">Something broke on our side.</h1>
      <p className="measure mt-4 text-muted">It’s been logged. Try again, or head back home.</p>
      {error.digest && <p className="mt-2 font-mono text-[0.75rem] text-subtle">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>
          <RotateCcw aria-hidden /> Try again
        </Button>
        <Link href="/" className={buttonClass({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </main>
  );
}
