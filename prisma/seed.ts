/**
 * Seeds the starting content on a brand-new database only. Runs on every deploy, but once the
 * site is set up it changes nothing (except creating the ADMIN_EMAIL account if it doesn't exist).
 *
 * Everything marked [Sample] is placeholder content for you to replace. It is created as a
 * draft/hidden, so nothing made-up appears on the live site.
 */
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sectionDefs, type SectionType } from "../src/lib/content";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const home: { type: SectionType; visible?: boolean; data: unknown }[] = [
  {
    type: "hero",
    data: {
      name: "Abdul-Quddus Inda",
      role: "Software engineer",
      location: "Nigeria · WAT (UTC+1)",
      headline: "I build secure, automated systems for businesses.",
      subline:
        "Web and backend development, AI automation, and network & security engineering.",
      primary: { label: "View work", href: "/#work" },
      secondary: { label: "Browse products", href: "/products" },
    },
  },
  {
    type: "work",
    data: {
      eyebrow: "Selected work",
      title: "Systems that run real businesses.",
      intro:
        "Each case study covers the problem, the architecture, the code that mattered and the result.",
    },
  },
  {
    type: "pillars",
    data: {
      eyebrow: "What I do",
      title: "Build. Secure. Automate.",
      items: [
        {
          key: "build",
          title: "Build",
          sentence:
            "Web apps, backends and APIs that are fast, typed end to end and easy to change.",
          capabilities: [
            "Web applications",
            "Backend services & APIs",
            "Database design",
            "Payments & integrations",
          ],
          tools: ["Next.js", "TypeScript", "Node.js", "Postgres", "Prisma"],
        },
        {
          key: "secure",
          title: "Secure",
          sentence:
            "Networks and servers set up properly, hardened, monitored and documented.",
          capabilities: [
            "Network & server setup",
            "Linux hardening",
            "Security headers & audits",
            "Home lab & monitoring",
          ],
          tools: ["Linux", "Docker", "Cloudflare", "WireGuard", "Caddy"],
        },
        {
          key: "automate",
          title: "Automate",
          sentence:
            "Workflows and AI agents that take repetitive work off your team’s plate.",
          capabilities: [
            "Workflow automation",
            "AI agents",
            "Business process automation",
            "Home automation",
          ],
          tools: ["n8n", "LLM APIs", "Webhooks", "Home Assistant"],
        },
      ],
    },
  },
  {
    type: "products",
    data: {
      eyebrow: "Products",
      title: "Templates, workflows and starters.",
      intro: "Built from real projects. Pay once, download instantly.",
    },
  },
  {
    type: "proof",
    data: { eyebrow: "Proof", title: "What clients say.", stats: [] },
  },
  {
    type: "contact",
    data: {
      title: "Have a system to build, secure or automate?",
      text: "Tell me what you’re working on. I reply within one working day.",
    },
  },
];

const about: { type: SectionType; visible?: boolean; data: unknown }[] = [
  {
    type: "story",
    data: {
      title:
        "I build software that’s secure by default and automated where it counts.",
      paragraphs: [
        "I’m Abdul-Quddus Sanusy Onuja Inda (most people just call me Inda), a software engineer based in Nigeria. I build web applications and backends, automate the repetitive parts of running a business, and set up networks and servers that stay up.",
        "[Sample] Replace these paragraphs with your own story in the admin: where you started, what you work on now, and what kind of projects you want more of.",
      ],
      photoId: null,
    },
  },
  {
    type: "timeline",
    visible: false,
    data: {
      title: "Timeline",
      items: [
        {
          year: "Now",
          title: "[Sample] Building inda.dev",
          text: "Replace with your real milestones, then make this section visible.",
        },
      ],
    },
  },
  {
    type: "skills",
    data: {
      title: "Skills",
      groups: [
        {
          key: "build",
          title: "Build",
          skills: [
            "TypeScript",
            "Next.js",
            "React",
            "Node.js",
            "Postgres",
            "Prisma",
            "REST APIs",
          ],
        },
        {
          key: "secure",
          title: "Secure",
          skills: [
            "Linux",
            "Networking",
            "Docker",
            "Cloudflare",
            "Security headers",
          ],
        },
        {
          key: "automate",
          title: "Automate",
          skills: ["n8n", "AI agents", "Webhooks", "Workflow design"],
        },
      ],
    },
  },
  {
    type: "certifications",
    data: {
      title: "Certifications & learning",
      intro:
        "I’m newer to cybersecurity than to software, so here’s exactly where I am: what I’ve earned and what I’m working through.",
    },
  },
  {
    type: "homelab",
    visible: false,
    data: {
      title: "Home lab",
      text: "[Sample] Describe your home lab and network setup here, then make this section visible.",
      items: [
        "[Sample] Router / firewall",
        "[Sample] Hypervisor",
        "[Sample] Monitoring",
      ],
    },
  },
  {
    type: "cv",
    data: { title: "CV", text: "The one-page version, as a PDF." },
  },
];

const LEGAL = {
  privacy: {
    title: "Privacy policy",
    body: `This policy explains what personal data inda.dev (inda.name.ng), run by Abdul-Quddus Sanusy Onuja Inda (trading as inda.dev) in Nigeria, collects, why, and your rights under the Nigeria Data Protection Act 2023.

## What I collect
- **Purchases:** your email, the product, amount, currency, time of purchase, the time you accepted the terms, and a download log (time, country and device type) used to protect your purchase and answer payment disputes.
- **Contact form:** your name, email, what you need, budget and message.
- **Analytics:** anonymous usage data (pages viewed, referrer, country and city from the hosting provider, device type, browser). No cookies are used for analytics, IP addresses are not stored, and Do Not Track / Global Privacy Control are respected.

## Why
To deliver what you bought, answer your messages, prevent fraud, and understand how the site is used so I can improve it.

## Who processes it
Paystack (payments), Cloudinary (file storage), Resend (email), Vercel (hosting), Neon (database) and Cloudflare (security). Card details go straight to Paystack; I never see or store them.

## How long
Order records are kept for 6 years for tax and dispute purposes. Contact messages are kept for 2 years. Raw analytics events are deleted after 13 months.

## Your rights
You can ask to see, correct or delete your data, or object to how it’s used. Email [hello@inda.name.ng](mailto:hello@inda.name.ng) and I’ll reply within 30 days. You can also complain to the Nigeria Data Protection Commission.`,
  },
  terms: {
    title: "Terms of use",
    body: `These terms apply to inda.name.ng and anything bought from it. The site is run by Abdul-Quddus Sanusy Onuja Inda (trading as inda.dev), Nigeria.

## Purchases
Prices are in Nigerian naira (NGN) and charged through Paystack. You receive a download link by email right after payment is confirmed. Links work for 72 hours and up to 5 downloads; you can request new links at [/downloads](/downloads).

## Delivery
All products are digital and delivered instantly by download. Nothing is shipped.

## Use of products
Your use of each product is governed by the [License](/license).

## Liability
Products are provided as-is. I’m not liable for indirect or consequential losses from using them. Nothing in these terms limits rights you have under Nigerian consumer protection law.

## Law
These terms are governed by the laws of the Federal Republic of Nigeria.

## Contact
[hello@inda.name.ng](mailto:hello@inda.name.ng)`,
  },
  refunds: {
    title: "Refund policy",
    body: `Because products are delivered instantly as downloads, purchases are not refundable once downloaded.

## When you can get a refund
If a file is broken, or the product is not as described, email [hello@inda.name.ng](mailto:hello@inda.name.ng) within 14 days of purchase with your order number. I’ll fix it or give you a full refund.

## How refunds are paid
Refunds go back to the original payment method through Paystack. Download links for a refunded order stop working.`,
  },
  license: {
    title: "License",
    body: `When you buy a product you get a personal, non-exclusive license to use it.

## You may
- Use it in your own projects.
- Use it in projects you build for clients.
- Modify it as much as you like.

## You may not
- Resell, share, give away or redistribute the files, modified or not.
- Include them in another template, kit or product for sale or free download.
- Share your download link.

Each download is stamped with the buyer’s email and order number.

Open-source parts keep their own licenses (for example MIT), included in the files where they apply.`,
  },
};

/** Starting content for a brand-new database. Never runs again once the site has been set up. */
async function seedContent() {
  await db.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Abdul-Quddus Inda",
      tagline: "Software engineer building secure, automated systems.",
      bio: "Software engineer in Nigeria building secure, automated systems: web and backend, AI automation, network & security.",
      email: "hello@inda.name.ng",
      whatsapp: "+234",
      bookingUrl: "",
      availability: true,
      availabilityText: "Available for new projects",
      socials: [
        { network: "github", label: "GitHub", href: "https://github.com/" },
        {
          network: "linkedin",
          label: "LinkedIn",
          href: "https://www.linkedin.com/",
        },
        { network: "x", label: "X", href: "https://x.com/" },
        { network: "tiktok", label: "TikTok", href: "https://www.tiktok.com/" },
        { network: "email", label: "Email", href: "mailto:hello@inda.name.ng" },
      ],
      logoIds: [],
    },
  });

  for (const [page, list] of [
    ["home", home],
    ["about", about],
  ] as const) {
    const existing = await db.section.count({ where: { page } });
    if (existing) continue;
    for (const [order, s] of list.entries()) {
      const data = sectionDefs[s.type].schema.parse(s.data); // seed data must pass the same validation as the admin
      await db.section.create({
        data: {
          page,
          type: s.type,
          order,
          visible: s.visible ?? true,
          data: data as object,
        },
      });
    }
  }

  for (const [slug, doc] of Object.entries(LEGAL)) {
    await db.legalDoc.upsert({
      where: { slug },
      update: {},
      create: { slug, ...doc },
    });
  }

  if ((await db.project.count()) === 0) {
    await db.project.create({
      data: {
        slug: "sample-invoice-automation",
        title: "[Sample] Invoice processing automation",
        pillar: "automate",
        industry: "Logistics",
        summary:
          "Replace with a real project: who it was for and what they needed.",
        result:
          "Replace with the real result, e.g. “Cut invoice processing from 3 hours to 10 minutes.”",
        content: {
          problem: "Describe the problem in plain words.",
          approach: "How you approached it, and why.",
          architecture:
            "Email inbox ──▶ n8n webhook ──▶ AI extraction ──▶ Postgres\n                                   │\n                                   └──▶ Slack approval ──▶ Accounting API",
          code: "// The key snippet that made it work",
          codeLang: "ts",
          results: "Real numbers only.",
        },
        stack: ["n8n", "Postgres", "TypeScript"],
        results: [],
        galleryIds: [],
        published: false,
        order: 0,
      },
    });
  }

  if ((await db.product.count()) === 0) {
    await db.product.create({
      data: {
        slug: "sample-n8n-starter-pack",
        title: "[Sample] n8n Starter Pack",
        summary:
          "Replace with a real product. Drafts never appear in the store.",
        description:
          "Describe what the product does and the problem it solves.",
        whatsInside: ["10 workflow JSON files", "Setup guide (PDF)"],
        audience: "Who it’s for.",
        faqs: [{ q: "Do I need a paid n8n plan?", a: "Answer honestly." }],
        priceNGN: 1500000,
        category: "workflows",
        galleryIds: [],
        status: "draft",
      },
    });
  }
}

async function seedAdmin() {
  // Admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env. Created once; an existing account is never touched.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12)
      throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    if (!(await db.user.findUnique({ where: { email: adminEmail } }))) {
      const passwordHash = await hash(adminPassword, {
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
      const user = await db.user.create({
        data: { email: adminEmail, passwordHash },
      });
      await db.auditLog.create({
        data: { userId: user.id, action: "admin.seeded" },
      });
      console.log(
        `Admin account created: ${adminEmail} (set up 2FA at first sign-in).`,
      );
    }
  }
}

async function main() {
  // The SiteSettings row exists from the first install on. After that, deploys never add or change
  // content: no samples come back even if you delete every product or case study.
  const installed = await db.siteSettings.findUnique({
    where: { id: 1 },
    select: { id: true },
  });
  if (installed) console.log("Site already set up: content left untouched.");
  else {
    await seedContent();
    console.log("Starting content created.");
  }
  await seedAdmin();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
