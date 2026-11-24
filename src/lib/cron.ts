import "server-only";
import { env } from "./env";
import { safeEqual } from "./crypto";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export function cronAuthorized(req: Request) {
  if (!env.cronSecret) return false;
  const got = req.headers.get("authorization") ?? "";
  return safeEqual(got, `Bearer ${env.cronSecret}`);
}
