"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { NETWORK_INFO, projectContentSchema, socialSchema } from "@/lib/content";
import { TAGS } from "@/lib/data";
import { uniqueSlug } from "@/lib/slug";
import { getSession, hashPassword, newBackupCodes, verifyPassword } from "@/lib/auth";
import { adminAction, publish, saveRevision } from "./common";

// ───────── Projects ─────────
const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(120),
  pillar: z.enum(["build", "secure", "automate"]),
  industry: z.string().trim().max(80),
  summary: z.string().trim().min(5).max(300),
  result: z.string().trim().min(3).max(160),
  content: projectContentSchema,
  stack: z.array(z.string().trim().min(1).max(40)).max(20),
  results: z.array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(20) })).max(3),
  coverId: z.string().nullable(),
  galleryIds: z.array(z.string()).max(8),
  liveUrl: z.string().trim().url().or(z.literal("")).nullable(),
  repoUrl: z.string().trim().url().or(z.literal("")).nullable(),
  published: z.boolean(),
});
export type ProjectInput = z.input<typeof projectSchema>;

export async function saveProject(input: ProjectInput) {
  return adminAction<{ id: string; slug: string }>("project.save", async (userId) => {
    const p = projectSchema.parse(input);
    // Generated from the title while it's a draft; fixed once it has been published so shared links keep working.
    const existing = p.id ? await db.project.findUnique({ where: { id: p.id }, select: { slug: true, published: true } }) : null;
    const slug =
      existing?.published
        ? existing.slug
        : await uniqueSlug(p.title, async (s) => Boolean(await db.project.findFirst({ where: { slug: s, ...(p.id ? { NOT: { id: p.id } } : {}) }, select: { id: true } })));
    const { id: _id, ...rest } = p;
    void _id;
    const data = { ...rest, slug, liveUrl: p.liveUrl || null, repoUrl: p.repoUrl || null };
    const order = p.id ? undefined : ((await db.project.aggregate({ _max: { order: true } }))._max.order ?? -1) + 1;
    const project = p.id ? await db.project.update({ where: { id: p.id }, data }) : await db.project.create({ data: { ...data, order: order! } });
    await saveRevision("project", project.id, data, userId);
    publish(TAGS.projects);
    return { target: project.id, data: { id: project.id, slug: project.slug }, message: p.published ? "Saved and live." : "Saved as draft." };
  });
}

export async function reorderProjects(ids: string[]) {
  return adminAction("project.reorder", async () => {
    await db.$transaction(ids.map((id, order) => db.project.update({ where: { id }, data: { order } })));
    publish(TAGS.projects);
    return { message: "Order saved." };
  });
}

export async function deleteProject(id: string) {
  return adminAction("project.delete", async () => {
    await db.project.delete({ where: { id } });
    publish(TAGS.projects);
    return { target: id, message: "Case study deleted." };
  });
}

// ───────── Certifications & testimonials ─────────
const certSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  issuer: z.string().trim().min(1).max(80),
  status: z.enum(["done", "in_progress", "planned"]),
  progress: z.number().int().min(0).max(100),
  date: z.string().trim().max(40),
  url: z.string().trim().url().or(z.literal("")).nullable(),
  order: z.number().int(),
});
export async function saveCertification(input: z.input<typeof certSchema>) {
  return adminAction<{ id: string }>("cert.save", async () => {
    const c = certSchema.parse(input);
    const { id: _id, ...rest } = c;
    void _id;
    const data = { ...rest, url: c.url || null };
    const row = c.id ? await db.certification.update({ where: { id: c.id }, data }) : await db.certification.create({ data });
    publish(TAGS.people);
    return { target: row.id, data: { id: row.id }, message: "Certification saved." };
  });
}
export async function deleteCertification(id: string) {
  return adminAction("cert.delete", async () => {
    await db.certification.delete({ where: { id } });
    publish(TAGS.people);
    return { target: id, message: "Removed." };
  });
}

const quoteSchema = z.object({
  id: z.string().optional(),
  quote: z.string().trim().min(10).max(600),
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().max(120),
  visible: z.boolean(),
  order: z.number().int(),
});
export async function saveTestimonial(input: z.input<typeof quoteSchema>) {
  return adminAction<{ id: string }>("testimonial.save", async () => {
    const t = quoteSchema.parse(input);
    const { id: _id, ...data } = t;
    void _id;
    const row = t.id ? await db.testimonial.update({ where: { id: t.id }, data }) : await db.testimonial.create({ data });
    publish(TAGS.people);
    return { target: row.id, data: { id: row.id }, message: "Quote saved." };
  });
}
export async function deleteTestimonial(id: string) {
  return adminAction("testimonial.delete", async () => {
    await db.testimonial.delete({ where: { id } });
    publish(TAGS.people);
    return { target: id, message: "Removed." };
  });
}

// ───────── Site settings ─────────
const settingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160),
  bio: z.string().trim().max(300),
  email: z.string().trim().email(),
  whatsapp: z.string().trim().max(30),
  bookingUrl: z.string().trim().url().or(z.literal("")),
  availability: z.boolean(),
  availabilityText: z.string().trim().max(60),
  socials: z.array(socialSchema).max(10),
  cvFileId: z.string().nullable(),
});
export async function saveSettings(input: z.input<typeof settingsSchema>) {
  return adminAction("settings.save", async (userId) => {
    const parsed = settingsSchema.parse(input);
    // Labels come from the network; empty profile links are dropped (email/WhatsApp links are built from the contact details).
    const socials = parsed.socials
      .filter((x) => x.network === "email" || x.network === "whatsapp" || x.href)
      .map((x) => ({ ...x, label: NETWORK_INFO[x.network].label, href: x.network === "email" || x.network === "whatsapp" ? "" : x.href }));
    const s = { ...parsed, socials };
    await db.siteSettings.update({ where: { id: 1 }, data: s });
    await saveRevision("settings", "1", s, userId);
    publish(TAGS.settings);
    return { message: "Settings saved." };
  });
}

// ───────── SEO ─────────
const seoSchema = z.object({ path: z.string().startsWith("/").max(200), title: z.string().trim().max(60), description: z.string().trim().max(155), ogImageId: z.string().nullable() });
export async function saveSeo(input: z.input<typeof seoSchema>) {
  return adminAction("seo.save", async () => {
    const s = seoSchema.parse(input);
    const data = { title: s.title || null, description: s.description || null, ogImageId: s.ogImageId };
    await db.seoMeta.upsert({ where: { path: s.path }, create: { path: s.path, ...data }, update: data });
    publish(TAGS.seo);
    return { target: s.path, message: "SEO saved." };
  });
}

// ───────── Legal ─────────
const legalSchema = z.object({ slug: z.enum(["privacy", "terms", "refunds", "license"]), title: z.string().trim().min(2).max(80), body: z.string().trim().min(20).max(50000) });
export async function saveLegal(input: z.input<typeof legalSchema>) {
  return adminAction("legal.save", async (userId) => {
    const l = legalSchema.parse(input);
    await db.legalDoc.upsert({ where: { slug: l.slug }, create: l, update: { title: l.title, body: l.body } });
    await saveRevision("legal", l.slug, l, userId);
    publish(TAGS.legal);
    return { target: l.slug, message: "Published. The “last updated” date is now today." };
  });
}

// ───────── Inbox ─────────
export async function setMessageStatus(id: string, status: "new" | "replied" | "archived") {
  return adminAction("message.status", async () => {
    await db.message.update({ where: { id }, data: { status } });
    return { target: id, meta: { status } };
  });
}

// ───────── Security ─────────
export async function revokeSession(id: string) {
  return adminAction("session.revoke", async (userId) => {
    await db.session.deleteMany({ where: { id, userId } });
    return { target: id, message: "Session signed out." };
  });
}

export async function revokeOtherSessions() {
  return adminAction("session.revoke_all", async (userId) => {
    const current = await getSession();
    const { count } = await db.session.deleteMany({ where: { userId, NOT: { id: current?.id } } });
    return { message: `Signed out ${count} other session${count === 1 ? "" : "s"}.` };
  });
}

export async function regenerateBackupCodes() {
  return adminAction<string[]>("2fa.backup_codes", async (userId) => {
    const codes = newBackupCodes();
    await db.user.update({ where: { id: userId }, data: { backupCodes: await Promise.all(codes.map((c) => hashPassword(c))) } });
    return { data: codes, message: "New backup codes created. Old ones no longer work." };
  });
}

const pwSchema = z.object({ current: z.string().min(1), next: z.string().min(12, "Use at least 12 characters.").max(200) });
export async function changePassword(input: z.input<typeof pwSchema>) {
  return adminAction("password.change", async (userId) => {
    const p = pwSchema.parse(input);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await verifyPassword(user.passwordHash, p.current))) throw new Error("Current password is wrong.");
    await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(p.next) } });
    const current = await getSession();
    await db.session.deleteMany({ where: { userId, NOT: { id: current?.id } } });
    return { message: "Password changed. Other sessions were signed out." };
  });
}
