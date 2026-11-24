import "server-only";
import { env } from "./env";

/** Verify a Cloudflare Turnstile token. Skipped only when no secret is configured outside production. */
export async function verifyTurnstile(token: string | undefined | null, ip?: string) {
  if (!env.turnstileSecret) {
    if (env.isProd) throw new Error("TURNSTILE_SECRET_KEY is required in production.");
    return true;
  }
  if (!token) return false;
  const body = new URLSearchParams({ secret: env.turnstileSecret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!res.ok) throw new Error(`Turnstile verification failed with HTTP ${res.status}`);
  const json = (await res.json()) as { success: boolean };
  return json.success;
}
