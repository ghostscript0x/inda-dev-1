"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verify as argonVerify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { audit, checkTotp, createSession, decrypt, destroySession, encrypt, getSession, hashPassword, LOCK_MS, MAX_FAILED_LOGINS, newBackupCodes, newTotpSecret, totpUri, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp, geoFromHeaders } from "@/lib/request";
import { alertOwner, emailLayout, escapeHtml, sendEmail } from "@/lib/notify";
import { randomInt } from "node:crypto";
import QRCode from "qrcode";
import { safeEqual, sha256 } from "@/lib/crypto";

export type FormState = { error?: string; ok?: string } | undefined;

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });

// A real hash (computed once) so unknown emails take the same time as known ones.
let dummyHash: Promise<string> | null = null;

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const h = await headers();
  const ip = clientIp(h);
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter your email and password." };
  const { email, password } = parsed.data;
  if (!(await rateLimit("login-ip", ip, 20, "15 m")) || !(await rateLimit("login-email", email, 10, "15 m"))) return { error: "Too many attempts. Wait 15 minutes and try again." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    await argonVerify(await (dummyHash ??= hashPassword("timing-equaliser")), password).catch(() => false);
    return { error: "Wrong email or password." };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) return { error: "This account is temporarily locked after too many failed attempts. Try again later." };

  if (!(await verifyPassword(user.passwordHash, password))) {
    const failed = user.failedLogins + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    await db.user.update({ where: { id: user.id }, data: { failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MS) : null } });
    await audit(user.id, lock ? "login.locked" : "login.failed", undefined, { country: geoFromHeaders(h).country });
    if (lock) await alertOwner("Admin account locked", `${MAX_FAILED_LOGINS} failed sign-in attempts for ${email}. Locked for 15 minutes. Country: ${geoFromHeaders(h).country ?? "unknown"}.`);
    return { error: lock ? "Too many failed attempts. The account is locked for 15 minutes." : "Wrong email or password." };
  }

  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  // Demo accounts are read-only and skip 2FA so the admin can be shown to clients.
  await createSession(user.id, user.isDemo);
  if (user.isDemo) {
    await audit(user.id, "login.demo");
    redirect("/admin");
  }
  redirect(user.totpEnabled ? "/admin/login/2fa" : "/admin/login/setup-2fa");
}

// ─── Email one-time code (alternative to the password; 2FA still follows) ───

export type CodeState = { error?: string; ok?: string; email?: string; sentAt?: number } | undefined;

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const emailSchema = z.string().trim().toLowerCase().email().max(200);

export async function requestLoginCodeAction(_: CodeState, form: FormData): Promise<CodeState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { error: "Enter a valid email." };
  const email = parsed.data;
  const ip = clientIp(await headers());
  if (!(await rateLimit("code-ip", ip, 10, "15 m")) || !(await rateLimit("code-email", email, 3, "15 m"))) return { error: "Too many codes requested. Wait 15 minutes and try again." };

  // Same reply whether or not the account exists, so this can't be used to discover admin emails.
  const sent = { ok: `If ${email} is an admin account, a 6-digit code is on its way. It expires in 10 minutes.`, email, sentAt: Date.now() };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.isDemo || (user.lockedUntil && user.lockedUntil > new Date())) return sent;

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.user.update({ where: { id: user.id }, data: { loginCodeHash: sha256(code), loginCodeExpires: new Date(Date.now() + CODE_TTL_MS), loginCodeAttempts: 0 } });
  await audit(user.id, "login.code_sent");
  try {
    await sendEmail({
      to: email,
      subject: `${code} is your inda.dev sign-in code`,
      text: `Your sign-in code is ${code}. It expires in 10 minutes and works once.

Didn't ask for it? Ignore this email; nobody can sign in without the code and your authenticator app.`,
      html: emailLayout("Your sign-in code", `<p>Use this code to sign in to the inda.dev admin:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;font-family:monospace">${code}</p><p style="color:#52525B;font-size:13px">It expires in 10 minutes and works once. Didn’t ask for it? Ignore this email; nobody can sign in without the code and your authenticator app.</p>`),
    });
  } catch (err) {
    console.error("[auth] login code email failed", err);
    return { error: "Couldn’t send the email. Try again or sign in with your password.", email };
  }
  return sent;
}

export async function verifyLoginCodeAction(_: CodeState, form: FormData): Promise<CodeState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { error: "Enter a valid email." };
  const email = parsed.data;
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!(await rateLimit("code-verify", email, 10, "15 m"))) return { error: "Too many attempts. Wait 15 minutes and try again.", email };
  const wrong = { error: "That code is wrong or has expired.", email };
  if (!/^\d{6}$/.test(code)) return wrong;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.loginCodeHash || !user.loginCodeExpires || user.loginCodeExpires < new Date()) return wrong;
  if (user.lockedUntil && user.lockedUntil > new Date()) return { error: "This account is temporarily locked. Try again later.", email };

  if (!safeEqual(sha256(code), user.loginCodeHash)) {
    const attempts = user.loginCodeAttempts + 1;
    // Too many wrong guesses burns the code; a new one must be requested.
    await db.user.update({ where: { id: user.id }, data: attempts >= MAX_CODE_ATTEMPTS ? { loginCodeHash: null, loginCodeExpires: null, loginCodeAttempts: 0 } : { loginCodeAttempts: attempts } });
    await audit(user.id, "login.code_failed");
    return attempts >= MAX_CODE_ATTEMPTS ? { error: "Too many wrong codes. Send a new one.", email } : wrong;
  }

  await db.user.update({ where: { id: user.id }, data: { loginCodeHash: null, loginCodeExpires: null, loginCodeAttempts: 0, failedLogins: 0 } });
  await audit(user.id, "login.code_ok");
  await createSession(user.id, false);
  redirect(user.totpEnabled ? "/admin/login/2fa" : "/admin/login/setup-2fa");
}

async function finishLogin(sessionId: string, userId: string, email: string, method: string) {
  await db.session.update({ where: { id: sessionId }, data: { verified: true } });
  const h = await headers();
  const geo = geoFromHeaders(h);
  const ua = h.get("user-agent") ?? "unknown device";
  await audit(userId, "login.success", undefined, { method, country: geo.country });
  const where = [geo.city, geo.country].filter(Boolean).join(", ") || "unknown location";
  try {
    await sendEmail({
      to: email,
      subject: "New sign-in to the inda.dev admin",
      text: `New sign-in from ${where}.\nDevice: ${ua}\nTime: ${new Date().toUTCString()}\n\nNot you? Sign in, open Security and log out all sessions, then change your password.`,
      html: emailLayout("New admin sign-in", `<p>New sign-in from <strong>${escapeHtml(where)}</strong>.</p><p style="color:#52525B;font-size:13px">Device: ${escapeHtml(ua)}<br>Time: ${new Date().toUTCString()}</p><p>Not you? Sign in, open <strong>Security</strong> and log out all sessions, then change your password.</p>`),
    });
  } catch (err) {
    console.error("[auth] login alert email failed", err);
  }
}

export async function verify2faAction(_: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!(await rateLimit("2fa", session.id, 6, "15 m"))) return { error: "Too many attempts. Sign in again in 15 minutes." };
  const code = String(form.get("code") ?? "").replace(/\s/g, "").toLowerCase();
  const user = session.user;
  if (!user.totpSecret || !user.totpEnabled) redirect("/admin/login/setup-2fa");

  let ok = await checkTotp(decrypt(user.totpSecret), code);
  let method = "totp";
  if (!ok && /^[0-9a-f]{5}-?[0-9a-f]{5}$/.test(code)) {
    // Backup code: single use.
    const normalized = code.includes("-") ? code : `${code.slice(0, 5)}-${code.slice(5)}`;
    for (const [i, h] of user.backupCodes.entries()) {
      if (await argonVerify(h, normalized).catch(() => false)) {
        await db.user.update({ where: { id: user.id }, data: { backupCodes: user.backupCodes.filter((_, j) => j !== i) } });
        ok = true;
        method = "backup_code";
        await alertOwner("Backup code used", `A 2FA backup code was used to sign in. ${user.backupCodes.length - 1} codes left.`);
        break;
      }
    }
  }
  if (!ok) {
    await audit(user.id, "2fa.failed");
    return { error: "That code didn’t work. Codes change every 30 seconds." };
  }
  await finishLogin(session.id, user.id, user.email, method);
  redirect("/admin");
}

/** Generates (once) and returns the pending 2FA secret as a QR data URL for enrollment. */
export async function getEnrollment() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.user.totpEnabled) redirect(session.verified ? "/admin/security" : "/admin/login/2fa");
  let secret = session.user.totpSecret ? decrypt(session.user.totpSecret) : null;
  if (!secret) {
    secret = newTotpSecret();
    await db.user.update({ where: { id: session.user.id }, data: { totpSecret: encrypt(secret) } });
  }
  const uri = totpUri(session.user.email, secret);
  return { secret, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220, color: { dark: "#09090B", light: "#FFFFFF" } }) };
}

export type EnrollState = { error?: string; codes?: string[] } | undefined;

export async function confirmEnrollmentAction(_: EnrollState, form: FormData): Promise<EnrollState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const user = session.user;
  if (!user.totpSecret) return { error: "Reload the page to get a new QR code." };
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!(await checkTotp(decrypt(user.totpSecret), code))) return { error: "That code didn’t work. Check your authenticator app’s time and try again." };
  const codes = newBackupCodes();
  await db.user.update({ where: { id: user.id }, data: { totpEnabled: true, backupCodes: await Promise.all(codes.map((c) => hashPassword(c))) } });
  await finishLogin(session.id, user.id, user.email, "totp_enroll");
  await audit(user.id, "2fa.enabled");
  return { codes };
}

export async function logoutAction() {
  const s = await getSession();
  if (s) await audit(s.user.id, "logout");
  await destroySession();
  redirect("/admin/login");
}
