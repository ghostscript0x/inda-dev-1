"use client";

import { useEffect } from "react";
import { track } from "@/components/site/track";

export function ProductViewTracker({ productId, title }: { productId: string; title: string }) {
  useEffect(() => {
    // t.js loads afterInteractive; retry briefly so the first view is not lost.
    let tries = 0;
    const id = setInterval(() => {
      if (window.indaTrack || ++tries > 20) {
        clearInterval(id);
        track("product_view", { productId, product: title });
      }
    }, 150);
    return () => clearInterval(id);
  }, [productId, title]);
  return null;
}
