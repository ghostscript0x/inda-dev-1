"use client";

import { useEffect } from "react";

/** A quiet note for anyone who opens devtools. */
export function ConsoleNote({ email }: { email: string }) {
  useEffect(() => {
    const w = window as unknown as { __indaNote?: boolean };
    if (w.__indaNote) return;
    w.__indaNote = true;
    console.log(
      "%cinda.dev%c\nPoking around? Good. Found something that looks like a vulnerability?\nReport it to " + email + " — see /.well-known/security.txt.\nResponsible disclosure is appreciated and credited.",
      "color:#00EFAE;font:600 14px ui-monospace,monospace",
      "color:inherit;font:12px ui-monospace,monospace",
    );
  }, [email]);
  return null;
}
