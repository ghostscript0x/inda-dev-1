import "server-only";
import { Resend } from "resend";
import { env } from "./env";

let resend: Resend | null = null;

type Mail = { to: string; subject: string; html: string; text: string };

/** Send an email via Resend. Without a key (local dev) the message is printed to the server log. */
export async function sendEmail(mail: Mail) {
  if (!env.resendKey) {
    if (env.isProd) throw new Error("RESEND_API_KEY is required in production.");
    console.info(`\n[email:dev] to=${mail.to} subject="${mail.subject}"\n${mail.text}\n`);
    return;
  }
  resend ??= new Resend(env.resendKey);
  const { error } = await resend.emails.send({ from: env.emailFrom, ...mail });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

/** Alert the site owner by email and (if configured) Telegram. Never throws: alerts must not break the request that raised them. */
export async function alertOwner(subject: string, text: string) {
  const jobs: Promise<unknown>[] = [];
  if (env.alertEmail) jobs.push(sendEmail({ to: env.alertEmail, subject: `[inda.dev] ${subject}`, text, html: emailLayout(subject, `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`) }));
  if (env.telegramToken && env.telegramChat) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${env.telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: env.telegramChat, text: `${subject}\n\n${text}`, disable_web_page_preview: true }),
      }).then((r) => {
        if (!r.ok) throw new Error(`Telegram HTTP ${r.status}`);
      }),
    );
  }
  if (!jobs.length) console.info(`[alert] ${subject}\n${text}`);
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("[alert] delivery failed:", r.reason);
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Minimal, client-safe email layout in the site's style. */
export function emailLayout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#FAFAFA;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#09090B">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:12px;padding:32px">
<tr><td style="padding-bottom:24px"><img src="${env.siteUrl}/logo/inda-logo-light-bg.png" width="99" height="24" alt="inda.dev" style="display:block;border:0;height:24px;width:99px"></td></tr>
<tr><td><h1 style="font-size:20px;line-height:1.3;margin:0 0 16px;letter-spacing:-0.02em">${escapeHtml(title)}</h1>
<div style="font-size:15px;line-height:1.6;color:#27272A">${body}</div></td></tr>
<tr><td style="padding-top:32px;font-size:12px;color:#71717A">Abdul-Quddus Inda · inda.name.ng</td></tr>
</table></td></tr></table></body></html>`;
}

export function emailButton(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#00EFAE;color:#09090B;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;margin:8px 0">${escapeHtml(label)}</a>`;
}
