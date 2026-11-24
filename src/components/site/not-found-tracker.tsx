"use client";

import { useEffect } from "react";
import { track } from "./track";

/** Records the broken URL (and where the visitor came from) for the 404 report. */
export function NotFoundTracker() {
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      if (window.indaTrack || ++tries > 20) {
        clearInterval(id);
        track("404", { url: location.pathname.slice(0, 200), from: document.referrer.slice(0, 200) || null });
      }
    }, 150);
    return () => clearInterval(id);
  }, []);
  return null;
}
