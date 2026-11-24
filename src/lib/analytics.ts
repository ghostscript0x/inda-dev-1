import "server-only";
import { UAParser } from "ua-parser-js";
import { isBot } from "ua-parser-js/bot-detection";
import { db } from "./db";

/**
 * Self-hosted analytics. No cookies, no IP storage. Visitors carry a random
 * anonymous ID generated in the browser; geo comes from host headers.
 */

const SEARCH = ["google.", "bing.", "duckduckgo.", "yahoo.", "yandex.", "baidu.", "ecosia.", "search.brave.", "startpage.", "qwant."];
const SOCIAL: Record<string, string> = {
  "t.co": "X",
  "x.com": "X",
  "twitter.com": "X",
  "linkedin.com": "LinkedIn",
  "lnkd.in": "LinkedIn",
  "facebook.com": "Facebook",
  "fb.com": "Facebook",
  "instagram.com": "Instagram",
  "l.instagram.com": "Instagram",
  "whatsapp.com": "WhatsApp",
  "wa.me": "WhatsApp",
  "reddit.com": "Reddit",
  "youtube.com": "YouTube",
  "github.com": "GitHub",
  "dev.to": "dev.to",
  "threads.net": "Threads",
  "tiktok.com": "TikTok",
};
const AI = ["chatgpt.com", "chat.openai.com", "perplexity.ai", "claude.ai", "gemini.google.com", "copilot.microsoft.com"];

export function classifySource(referrer: string | null, utmSource: string | null, siteHost: string) {
  if (utmSource) return { source: "campaign", referrerHost: referrer ? hostOf(referrer) : null };
  if (!referrer) return { source: "direct", referrerHost: null };
  const host = hostOf(referrer);
  if (!host || host === siteHost) return { source: "direct", referrerHost: null };
  if (AI.some((a) => host.endsWith(a))) return { source: "ai", referrerHost: host };
  if (SEARCH.some((s) => host.includes(s))) return { source: "search", referrerHost: host };
  const bare = host.replace(/^www\.|^m\./, "");
  if (SOCIAL[bare]) return { source: "social", referrerHost: SOCIAL[bare] };
  return { source: "referral", referrerHost: host };
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function parseUA(ua: string) {
  const r = UAParser(ua);
  const type = r.device.type;
  const device = type === "mobile" ? "phone" : type === "tablet" ? "tablet" : type === "smarttv" || type === "console" ? "other" : "desktop";
  return { device, browser: r.browser.name ?? "Unknown", os: r.os.name ?? "Unknown", bot: isBot(r) || /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime/i.test(ua) };
}

/** Record an event from server code (payments, downloads), which ad blockers cannot hide. */
export async function recordServerEvent(e: { type: string; path: string; visitorId: string; props?: Record<string, unknown>; value?: number; country?: string | null }) {
  try {
    await db.event.create({
      data: {
        type: e.type,
        path: e.path,
        visitorId: e.visitorId,
        sessionId: `srv_${e.visitorId}`,
        country: e.country ?? null,
        props: e.props as object | undefined,
        value: e.value,
        source: (e.props?.source as string | undefined) ?? null,
      },
    });
  } catch (err) {
    // Analytics must never break a purchase or a download; log loudly instead.
    console.error("[analytics] failed to record server event", e.type, err);
  }
}
