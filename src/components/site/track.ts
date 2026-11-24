"use client";

declare global {
  interface Window {
    indaTrack?: (type: string, props?: Record<string, unknown>, value?: number) => void;
  }
}

/** Send a custom analytics event through the site's own tracker (public/t.js). */
export function track(type: string, props?: Record<string, unknown>, value?: number) {
  window.indaTrack?.(type, props, value);
}
