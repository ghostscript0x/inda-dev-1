/** Runs once when the server starts. Logs missing production settings so they show up in the host's logs. */
export function register() {
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_RUNTIME !== "nodejs") return;
  const required = ["DATABASE_URL", "AUTH_SECRET", "CRON_SECRET", "NEXT_PUBLIC_SITE_URL", "PAYSTACK_SECRET_KEY", "RESEND_API_KEY", "CLOUDINARY_URL", "TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) console.error(`[config] Missing environment variables: ${missing.join(", ")}. Related features will fail until they are set.`);
}
