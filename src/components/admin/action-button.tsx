"use client";

import { Loader2 } from "lucide-react";
import { Button, type ButtonStyle } from "@/components/ui/button";
import type { ActionResult } from "@/app/admin/actions/common";
import { useRun } from "./product-row-actions";

/** Button that runs a server action, shows a toast and refreshes. Optional confirm prompt. */
export function ActionButton<T>({ action, children, confirmText, className, ...style }: { action: () => Promise<ActionResult<T>>; children: React.ReactNode; confirmText?: string; className?: string } & ButtonStyle) {
  const { run, pending } = useRun();
  return (
    <Button
      {...style}
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        run(action);
      }}
    >
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}
