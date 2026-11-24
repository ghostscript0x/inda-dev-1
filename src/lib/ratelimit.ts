import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";

type Window = `${number} ${"s" | "m" | "h"}`;
const limiters = new Map<string, Ratelimit>();
const memory = new Map<string, { count: number; reset: number }>();

const toMs = (w: Window) => {
  const [n, unit] = w.split(" ");
  return Number(n) * (unit === "s" ? 1000 : unit === "m" ? 60_000 : 3_600_000);
};

/**
 * Sliding-window rate limit. Uses Upstash Redis when configured; otherwise an
 * in-process fixed window (fine for local dev, not shared across instances).
 */
export async function rateLimit(bucket: string, key: string, limit: number, window: Window) {
  if (env.upstash) {
    const id = `${bucket}:${limit}:${window}`;
    let rl = limiters.get(id);
    if (!rl) {
      rl = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(limit, window), prefix: `rl:${bucket}` });
      limiters.set(id, rl);
    }
    const { success } = await rl.limit(key);
    return success;
  }
  const k = `${bucket}:${key}`;
  const now = Date.now();
  const entry = memory.get(k);
  if (!entry || entry.reset < now) {
    memory.set(k, { count: 1, reset: now + toMs(window) });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
