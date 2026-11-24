"use client";

// Runs before first paint so the saved theme never flashes. Dark is the default.
const BOOT = `(function(){var t=null;try{t=localStorage.getItem("theme")}catch(e){}document.documentElement.dataset.theme=t==="light"?"light":"dark"})()`;

/**
 * Server HTML gets a real inline script (executed by the browser while parsing <head>).
 * If React ever creates this element in the browser, it is an inert data block instead:
 * the theme is already applied by then, and React doesn't warn about non-executable scripts.
 */
export function BootScript() {
  const isServer = typeof window === "undefined";
  return <script type={isServer ? undefined : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
