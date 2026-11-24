import { z } from "zod";

/**
 * Section blocks. Each page is an ordered list of sections stored as JSON.
 * `schema` validates on save; `fields` drives the admin form; the site renders
 * the matching component. Shared by server and client (no server-only imports).
 */

export type Field =
  | { name: string; label: string; kind: "text" | "textarea" | "url"; help?: string; max?: number }
  | { name: string; label: string; kind: "boolean"; help?: string }
  | { name: string; label: string; kind: "image"; help?: string }
  | { name: string; label: string; kind: "select"; options: { value: string; label: string }[] }
  | { name: string; label: string; kind: "strings"; help?: string }
  | { name: string; label: string; kind: "object"; fields: Field[] }
  | { name: string; label: string; kind: "list"; itemLabel: string; fields: Field[] };

const linkFields: Field[] = [
  { name: "label", label: "Label", kind: "text" },
  { name: "href", label: "Link", kind: "text" },
];

const str = (max = 300) => z.string().trim().max(max);
const link = z.object({ label: str(40), href: str(300) });
const pillarKey = z.enum(["build", "secure", "automate"]);

export const sectionDefs = {
  // ───────── Home ─────────
  hero: {
    label: "Hero",
    page: "home",
    schema: z.object({
      name: str(60).default(""), // legacy: the hero now uses the name from Site settings
      role: str(80).default(""),
      location: str(80).default(""),
      headline: str(120),
      subline: str(200),
      primary: link,
      secondary: link,
    }),
    fields: [
      { name: "role", label: "Role", kind: "text", max: 80, help: "e.g. Software engineer" },
      { name: "location", label: "Location", kind: "text", max: 80, help: "e.g. Lagos, Nigeria · WAT (UTC+1)" },
      { name: "headline", label: "Headline", kind: "textarea", max: 120 },
      { name: "subline", label: "Subline", kind: "textarea", max: 200 },
      { name: "primary", label: "Primary button", kind: "object", fields: linkFields },
      { name: "secondary", label: "Secondary button", kind: "object", fields: linkFields },
    ] as Field[],
  },
  work: {
    label: "Selected work",
    page: "home",
    schema: z.object({ eyebrow: str(40), title: str(120), intro: str(300) }),
    fields: [
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "title", label: "Title", kind: "text" },
      { name: "intro", label: "Intro", kind: "textarea" },
    ] as Field[],
  },
  pillars: {
    label: "What I do",
    page: "home",
    schema: z.object({
      eyebrow: str(40),
      title: str(120),
      items: z
        .array(
          z.object({
            key: pillarKey,
            title: str(40),
            sentence: str(200),
            capabilities: z.array(str(80)).max(6),
            tools: z.array(str(30)).max(10),
          }),
        )
        .max(3),
    }),
    fields: [
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "title", label: "Title", kind: "text" },
      {
        name: "items",
        label: "Pillars",
        kind: "list",
        itemLabel: "Pillar",
        fields: [
          { name: "key", label: "Pillar", kind: "select", options: [{ value: "build", label: "Build" }, { value: "secure", label: "Secure" }, { value: "automate", label: "Automate" }] },
          { name: "title", label: "Title", kind: "text" },
          { name: "sentence", label: "One sentence", kind: "textarea" },
          { name: "capabilities", label: "Capabilities (one per line)", kind: "strings" },
          { name: "tools", label: "Tools (one per line)", kind: "strings" },
        ],
      },
    ] as Field[],
  },
  products: {
    label: "Products",
    page: "home",
    schema: z.object({ eyebrow: str(40), title: str(120), intro: str(300) }),
    fields: [
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "title", label: "Title", kind: "text" },
      { name: "intro", label: "Intro", kind: "textarea" },
    ] as Field[],
  },
  proof: {
    label: "Proof",
    page: "home",
    schema: z.object({
      eyebrow: str(40),
      title: str(120),
      stats: z.array(z.object({ value: str(20), label: str(80) })).max(3),
    }),
    fields: [
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "title", label: "Title", kind: "text" },
      { name: "stats", label: "Numbers (max 3, real ones only)", kind: "list", itemLabel: "Number", fields: [{ name: "value", label: "Value", kind: "text" }, { name: "label", label: "Label", kind: "text" }] },
    ] as Field[],
  },
  contact: {
    label: "Contact",
    page: "home",
    schema: z.object({ title: str(120), text: str(300) }),
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "text", label: "Text", kind: "textarea" },
    ] as Field[],
  },

  // ───────── About ─────────
  story: {
    label: "Story",
    page: "about",
    schema: z.object({ title: str(120), paragraphs: z.array(str(800)).max(8), photoId: z.string().nullable() }),
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "paragraphs", label: "Paragraphs (one per line)", kind: "strings" },
      { name: "photoId", label: "Photo", kind: "image" },
    ] as Field[],
  },
  timeline: {
    label: "Timeline",
    page: "about",
    schema: z.object({
      title: str(120),
      items: z.array(z.object({ year: str(20), title: str(120), text: str(400) })).max(20),
    }),
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "items", label: "Entries", kind: "list", itemLabel: "Entry", fields: [{ name: "year", label: "Year", kind: "text" }, { name: "title", label: "Title", kind: "text" }, { name: "text", label: "Text", kind: "textarea" }] },
    ] as Field[],
  },
  skills: {
    label: "Skills",
    page: "about",
    schema: z.object({
      title: str(120),
      groups: z.array(z.object({ key: pillarKey, title: str(40), skills: z.array(str(60)).max(20) })).max(3),
    }),
    fields: [
      { name: "title", label: "Title", kind: "text" },
      {
        name: "groups",
        label: "Groups",
        kind: "list",
        itemLabel: "Group",
        fields: [
          { name: "key", label: "Pillar", kind: "select", options: [{ value: "build", label: "Build" }, { value: "secure", label: "Secure" }, { value: "automate", label: "Automate" }] },
          { name: "title", label: "Title", kind: "text" },
          { name: "skills", label: "Skills (one per line)", kind: "strings" },
        ],
      },
    ] as Field[],
  },
  certifications: {
    label: "Certifications",
    page: "about",
    schema: z.object({ title: str(120), intro: str(400) }),
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "intro", label: "Intro", kind: "textarea" },
    ] as Field[],
  },
  homelab: {
    label: "Home lab",
    page: "about",
    schema: z.object({ title: str(120), text: str(1200), items: z.array(str(120)).max(12) }),
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "text", label: "Text", kind: "textarea", max: 1200 },
      { name: "items", label: "Setup items (one per line)", kind: "strings" },
    ] as Field[],
  },
  cv: {
    label: "CV",
    page: "about",
    schema: z.object({ title: str(120), text: str(300) }),
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "text", label: "Text", kind: "textarea" },
    ] as Field[],
  },
} as const;

export type SectionType = keyof typeof sectionDefs;
export type SectionData<T extends SectionType> = z.infer<(typeof sectionDefs)[T]["schema"]>;
export const sectionTypes = Object.keys(sectionDefs) as SectionType[];

export function isSectionType(t: string): t is SectionType {
  return t in sectionDefs;
}

// ───────── Other shared schemas ─────────

export const socialSchema = z.object({
  network: z.enum(["github", "linkedin", "x", "tiktok", "whatsapp", "email", "youtube", "instagram", "devto"]),
  label: str(40),
  href: str(300),
});
export type Social = z.infer<typeof socialSchema>;

/** Display name and link format for each network, so the admin only needs the profile link. */
export const NETWORK_INFO: Record<Social["network"], { label: string; placeholder: string }> = {
  github: { label: "GitHub", placeholder: "https://github.com/yourname" },
  linkedin: { label: "LinkedIn", placeholder: "https://www.linkedin.com/in/yourname" },
  x: { label: "X", placeholder: "https://x.com/yourname" },
  tiktok: { label: "TikTok", placeholder: "https://www.tiktok.com/@yourname" },
  youtube: { label: "YouTube", placeholder: "https://www.youtube.com/@yourname" },
  instagram: { label: "Instagram", placeholder: "https://www.instagram.com/yourname" },
  devto: { label: "DEV", placeholder: "https://dev.to/yourname" },
  email: { label: "Email", placeholder: "" },
  whatsapp: { label: "WhatsApp", placeholder: "" },
};

/**
 * Fill in what can be derived: the label comes from the network, and the email / WhatsApp
 * links are built from the contact details so they never go stale.
 */
export function resolveSocials(socials: Social[], contact: { email: string; whatsapp: string }): Social[] {
  const digits = contact.whatsapp.replace(/\D/g, "");
  // A WhatsApp number in the contact details is enough: add the link even if it isn't in the list.
  const list = digits.length >= 8 && !socials.some((s) => s.network === "whatsapp") ? [...socials, { network: "whatsapp" as const, label: "WhatsApp", href: "" }] : socials;
  return list.flatMap((s) => {
    const label = s.label.trim() || NETWORK_INFO[s.network].label;
    if (s.network === "email") return contact.email ? [{ ...s, label, href: `mailto:${contact.email}` }] : [];
    if (s.network === "whatsapp") return digits.length >= 8 ? [{ ...s, label, href: `https://wa.me/${digits}` }] : [];
    return [{ ...s, label }];
  });
}

export const projectContentSchema = z.object({
  problem: str(4000),
  approach: str(4000),
  architecture: str(4000), // a plain-text diagram or description shown in a mono block
  code: str(6000), // key snippet
  codeLang: str(20),
  results: str(4000),
});
export type ProjectContent = z.infer<typeof projectContentSchema>;

export const faqSchema = z.array(z.object({ q: str(200), a: str(1000) })).max(20);

export const PILLARS = {
  build: { label: "Build", long: "Software Engineering" },
  secure: { label: "Secure", long: "Cybersecurity & Networking" },
  automate: { label: "Automate", long: "AI Automation" },
} as const;

export const PRODUCT_CATEGORIES = {
  templates: "Templates",
  workflows: "n8n workflows",
  starters: "Code starters",
  guides: "Guides",
  scripts: "Scripts",
} as const;

export const SERVICES = ["Build", "Secure", "Automate", "Product support"] as const;
export const BUDGETS = ["Under ₦500k / $500", "₦500k–₦2M / $500–$2k", "₦2M–₦5M / $2k–$5k", "₦5M+ / $5k+", "Not sure yet"] as const;
