import "server-only";

/** Feature flags derived from which credentials are present in .env. */
export const env = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  isProd: process.env.NODE_ENV === "production",
  authSecret: process.env.AUTH_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  alertEmail: process.env.ALERT_EMAIL ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "inda.dev <hello@inda.name.ng>",
  paystackSecret: process.env.PAYSTACK_SECRET_KEY ?? "",
  resendKey: process.env.RESEND_API_KEY ?? "",
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChat: process.env.TELEGRAM_CHAT_ID ?? "",
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  cloudinary: Boolean(process.env.CLOUDINARY_URL),
  upstash: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
};

export function requireSecret(name: string, value: string) {
  if (!value) throw new Error(`${name} is not configured. Set it in .env.`);
  return value;
}
