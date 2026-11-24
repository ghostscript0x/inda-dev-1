import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { hash, verify as argonVerify } from "@node-rs/argon2";
import { generateSecret, generateURI, verify as verifyOtp } from "otplib";
import { db } from "./db";
import { env, requireSecret } from "./env";
import { randomToken, sha256 } from "./crypto";
import { geoFromHeaders } from "./request";

export const SESSION_COOKIE = env.isProd ? "__Host-inda_admin" : "inda_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // absolute lifetime
const IDLE_TTL_MS = 60 * 60 * 1000; // logged out after 1h of inactivity
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MS = 15 * 60 * 1000;

export const hashPassword = (pw: string) => hash(pw, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
export const verifyPassword = (h: string, pw: string) => argonVerify(h, pw);

// ── 2FA secret encryption (AES-256-GCM keyed from AUTH_SECRET) ──
function key() {
  return createHash("sha256").update(requireSecret("AUTH_SECRET", env.authSecret)).digest();
}
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}
export function decrypt(payload: string) {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

export function totpUri(email: string, secret: string) {
  return generateURI({ issuer: "inda.dev admin", label: email, secret });
}
export const newTotpSecret = () => generateSecret();
export async function checkTotp(secret: string, token: string) {
  if (!/^\d{6}$/.test(token)) return false;
  const res = await verifyOtp({ secret, token, epochTolerance: 30 });
  return res.valid;
}

export function newBackupCodes() {
  return Array.from({ length: 8 }, () => randomBytes(5).toString("hex").replace(/(.{5})/, "$1-"));
}

// ── Sessions ──
export async function createSession(userId: string, verified: boolean) {
  const token = randomToken(32);
  const h = await headers();
  const geo = geoFromHeaders(h);
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      verified,
      country: geo.country,
      ua: h.get("user-agent")?.slice(0, 300) ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/** Current session (or null). `verified` is false until the 2FA step passes. */
export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() < now || session.lastSeenAt.getTime() + IDLE_TTL_MS < now) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (now - session.lastSeenAt.getTime() > 60_000) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return session;
});

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** For admin pages: returns the fully verified session or redirects to login. */
export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  if (!s.verified) redirect(s.user.totpEnabled ? "/admin/login/2fa" : "/admin/login/setup-2fa");
  return s;
}

/** For mutations: verified, non-demo user. Throws instead of redirecting. */
export async function requireWriter() {
  const s = await getSession();
  if (!s || !s.verified) throw new Error("Not signed in.");
  if (s.user.isDemo) throw new Error("The demo account is read-only.");
  return s;
}

export async function audit(userId: string | null, action: string, target?: string, meta?: Record<string, unknown>) {
  await db.auditLog.create({ data: { userId, action, target, meta: meta as object | undefined } });
}
