"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; "expired-callback"?: () => void; theme?: string; appearance?: string }) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<void> | null = null;
function load() {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Could not load the spam check. Check your connection and try again."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Cloudflare Turnstile (invisible-ish, no CAPTCHA puzzles). Renders nothing when no site key is configured. */
export function Turnstile({ onToken, onError }: { onToken: (token: string | null) => void; onError?: (msg: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!SITE_KEY) return;
    let id: string | undefined;
    let cancelled = false;
    load()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        id = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          callback: onToken,
          "expired-callback": () => onToken(null),
          theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",
          appearance: "interaction-only",
        });
      })
      .catch((e: Error) => onError?.(e.message));
    return () => {
      cancelled = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [onToken, onError]);
  if (!SITE_KEY) return null;
  return <div ref={ref} />;
}

export const turnstileEnabled = Boolean(SITE_KEY);
