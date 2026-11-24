# inda.dev — Portfolio Build Plan

Nov 24, 2026 · @GhostScript

The portfolio of **Abdul-Quddus Inda** **(brand: inda.dev), live at inda.name.ng**: minimal, professional and fast, with an admin that can edit every word and image on the site.

Design tokens, specs and the ready-to-paste `CLAUDE.md` for building it: Claude Code brief

## The concept

The direction is **quiet confidence**: minimal, precise and fast, the way Linear, Vercel or Stripe present themselves. Quality shows in typography, spacing and detail, never in glow or effects.

**Hero line:** *Software engineer building secure, automated systems.* **Subline:** Web and backend development, AI automation, and network & security engineering.

Three pillars run through the site:

| Pillar | What it covers | Shown through |
| --- | --- | --- |
| **Build** — Software Engineering | Web development, backend, APIs, databases | Case studies with architecture and results |
| **Secure** — Cybersecurity & Networking | Home lab, network and server setup, security learning, CTF write-ups | Home lab and certifications on the About page |
| **Automate** — AI Automation | Workflow automation, AI agents, home automation | Real workflows with before/after numbers |

**What makes it look senior, not AI-generated**

- One accent color (your logo green), used sparingly: links, the primary button, small markers. The rest is black, white and gray.
- A strict 12-column grid, an 8px spacing scale and generous whitespace.
- Real content over decoration: real screenshots, real numbers, real code. No stock illustrations, gradient blobs, glassmorphism, emoji or "AI sparkle" icons.
- Motion only where it helps (150–300ms, ease-out). No glow, particles, typing effects or boot screens.
- Every small state designed: focus, hover, empty, loading skeletons, errors, 404, share images, favicon.
- Copy that is short and specific: "Cut invoice processing from 3 hours to 10 minutes", not "passionate about innovative solutions".

Being new to cybersecurity is shown honestly on the About page: certifications and courses in progress, plus a short note on your home lab and network setup.

## Brand & visual system

Everything is taken from your logo: the mint green `#00EFAE` and the near-black tile `#09090B`. Dark mode is the default because the logo was designed on black; light mode is one click away.

**Colors**

| Token | Dark mode | Light mode | Use |
| --- | --- | --- | --- |
| Background | `#09090B` | `#FFFFFF` | Page |
| Surface | `#111113` | `#FAFAFA` | Cards, panels, inputs |
| Border | `#1F1F23` | `#E4E4E7` | Hairlines, dividers |
| Text | `#FAFAFA` | `#09090B` | Headings and body |
| Muted text | `#A1A1AA` | `#52525B` | Captions, dates, meta |
| Accent | `#00EFAE` | `#00EFAE` fill, `#007A5A` text | Primary button, links, markers |

On white, `#00EFAE` is too light for text, so light mode uses it only as a button fill (with dark text) and a deeper `#007A5A` for links. Check every pair for 4.5:1 contrast.

**Logo**

- I'll rebuild it as a clean **vector (SVG)** rather than cutting out the PNG: the icon is pure geometry, so the vector will be sharper at every size and have no leftover edges.
- Variants: full logo for dark backgrounds (white "inda"), full logo for light (near-black "inda"), icon tile only, favicon and app icons (16px to 512px), and the default share image.
- One signature detail, used quietly: the **diagonal stroke from the icon** becomes the site's motif (a thin line in the hero graphic, section dividers, the active nav marker).

**Typography**

- **Geist Sans** for headings and body, **Geist Mono** for code, dates and labels. Clean and engineered, close to your wordmark's geometric feel.
- Type scale: 14 / 16 / 18 / 24 / 32 / 48 / 64px, headings with tight letter-spacing (-0.02em). Body text max 68 characters per line.
- Loaded through `next/font`, so text never jumps.

**Motion**

- Sections fade in with an 8px rise, once. Hover states in 150ms. Page changes use the View Transitions API.
- No parallax, scroll-jacking, particles, glow or typing effects. Everything respects reduced-motion settings.

**Stack for the UI:** Tailwind CSS, shadcn/ui (built on Radix, accessible by default), Framer Motion, Lucide icons.

## Site map

Only five public pages plus checkout and admin. No blog, no lab, nothing you'd have to keep feeding.

| Route | Page | Rendering |
| --- | --- | --- |
| `/` | Home: hero, work, what I do, products, contact | Static, refreshed when you publish |
| `/work/[slug]` | One page per case study (3–5 total) | Static |
| `/products` | All digital products | Static, refreshed when you publish |
| `/products/[slug]` | One product: details, preview, buy | Static, refreshed when you publish |
| `/about` | Story, skills, certifications, CV download | Static |
| `/contact` | Contact form and booking | Static + API |
| `/downloads/[token]` | Secure download after purchase | Dynamic |
| `/admin` | Dashboard, mainly for products | Dynamic, login required |

No separate `/work` list page: the homepage's work section is the list. Services live as a section on the homepage, not separate pages.

The nav shows: Work · Products · About (Work scrolls to the homepage section), plus a green **Contact** button and a `⌘K` search icon.

## Homepage, section by section

Seven sections, each with one job. The impression comes from restraint and proof, the way a senior designer would do it.

1. **Header**
   - Logo left; Work · Products · About; search (`⌘K`), theme toggle and a **Contact** button on the right.
   - Transparent at the top; gains a solid background and a 1px border once you scroll. On phones, a full-screen menu with large tap targets.
2. **Hero**
   - Left-aligned, lots of space. A small status pill: a green dot + "Available for new projects" (you switch it in the admin).
   - Name in Geist Mono, small: `Abdul-Quddus Inda`. Then the large headline: *Software engineer building secure, automated systems.* Then the one-line subline.
   - Two buttons: **View work** (green) and **Browse products** (outline).
   - On the right (below on phones): one quiet graphic built from the icon's diagonal stroke, a thin-line drawing of a system (app, network, automation), drawn once on load.
3. **Selected work**
   - Three to five case studies in a clean list: big real screenshot, title, one-line result, stack tags. Each opens its own page.
4. **What I do**
   - Three columns: Build, Secure, Automate. Each: one sentence, 4 capabilities, the main tools as small mono labels. This replaces separate service pages.
5. **Products**
   - The 3 newest or featured products: cover, name, one line, price, **Buy** button. "All products →".
6. **Proof**
   - Two or three real client quotes with name and role, and a row of three real numbers. Hidden in the admin until you have real ones.
7. **Contact + footer**
   - One line, "Have a system to build, secure or automate?", with email, WhatsApp and booking buttons.
   - Footer: logo, one-line bio, links, socials, © Abdul-Quddus Inda.

**Site-wide details**

- **Command menu (⌘K / Ctrl+K):** search pages, projects and products; switch theme. A standard in pro tools, and it signals craft.
- **Keyboard-friendly** everywhere, with visible focus rings.
- **For security people:** a short, tasteful message in the browser console and a `security.txt`. Invisible to everyone else.
- **404 page** in the same clean style, with search and links back.
- **Social sidebar:** on desktop, a thin fixed rail on the left edge with icons for GitHub, LinkedIn, X, WhatsApp and email, stacked vertically and ending in a short vertical line (echoing the logo's stroke). Icons are muted gray and turn green on hover, with a small tooltip. On the right edge, your email `hello@inda.name.ng` in Geist Mono, set vertically. On phones and tablets the rail hides and the same icons sit in the menu and footer. You add, remove or reorder links in the admin under Site settings.

## Inner pages

**Work (`/work`)**

-
- Each case study follows one template: Problem → Approach → Architecture diagram → Key code or screenshots → Results → Stack → Links (live, GitHub).
- A "Next project" panel at the bottom keeps people browsing.

**Products (`/products`)**

- Grid with filters by category (templates, n8n workflows, code starters, guides, scripts).
- Product page: preview images or video, what's inside, who it's for, price, reviews, FAQs, "Buy now".

**About (`/about`)**

- Your story in short paragraphs, a photo, an interactive timeline, skills grouped by pillar (no percentage bars), certifications, and a downloadable CV.

**Contact (`/contact`)**

- Form: name, email, what you need (Build / Secure / Automate / Product support), budget range, message.
- Booking link (Cal.com), WhatsApp button, and email.
- Submissions save to the database and send you an email or Telegram alert.

## Admin: products first

The admin opens straight on **Products**, because that's what you'll update most. Adding a product takes about two minutes:

1. Click **New product**.
2. Drag in the product file (zip, PDF, template) and 1–5 preview images.
3. Fill in name, one-line summary, description, what's inside, price in NGN and USD (or mark it free).
4. Click **Preview** to see the real product page, then **Publish**. It appears on `/products` and the homepage within seconds.

The Products screen also shows each product's sales, revenue and downloads, with quick actions: edit, hide, duplicate, change price, replace file.

Everything else on the site is still editable, but you'll rarely touch it:

| Area | What you can edit |
| --- | --- |
| **Products** (main) | Products, files, preview images, prices, coupons; orders, refunds, review approval; sales overview |
| Site settings | Name, tagline, logo, social links, email, WhatsApp, booking link, availability status, CV file |
| Homepage | Text, buttons and images of every section; show, hide or reorder sections |
| Work | Case studies: text, screenshots, results, stack, order |
| About | Bio, photo, skills, certifications, home lab note |
| SEO | Title, description and share image per page |
| Inbox | Contact messages with status |

**How it works**

- **Section blocks:** each page is an ordered list of sections (Hero, Work list, Pillars, Quotes, CTA…), stored as typed JSON and validated with Zod. The admin shows a form for each section type; the site renders the matching component. You change content freely, and the design always stays consistent.
- **Draft → preview → publish:** edit safely, preview the real page in Next.js draft mode, then publish. Publishing refreshes only the affected pages within seconds (`revalidateTag`).
- **Version history:** every save is kept; restore any earlier version in one click.
- **Quality of life:** autosave, unsaved-changes warning, drag-and-drop uploads, search and filters on every list, keyboard shortcuts.
- **Security:** login with password + 2FA (authenticator app), short sessions, a log of every admin action, and alerts on new logins.

The admin uses the same design system and should feel like a polished SaaS product. It's also a portfolio piece you can show (with a demo account) to prove you build real software.

## Analytics: your own, built in

The site tracks itself. No Google Analytics, no third-party scripts, no cookie banner: a tiny script (under 2 KB) sends events to your own API, they're stored in your Postgres, and the admin shows them in an **Analytics** dashboard.

**What gets tracked**

| Category | Data |
| --- | --- |
| Traffic | Page views, unique visitors, sessions, new vs returning visitors, pages per session, bounce rate, session duration |
| Pages | Top pages, entry pages, exit pages, time on page, scroll depth (25/50/75/100%), 404 hits with the broken URL |
| Sources | Referrer sites, search engines, social networks, direct, UTM source/medium/campaign, QR or link-in-bio tags |
| Audience | Country, region and city, language, timezone |
| Technology | Device type (phone, tablet, desktop), browser, OS, screen size, dark vs light theme |
| Engagement | Clicks on every button and CTA, social link clicks (per network), email and WhatsApp clicks, CV downloads, outbound links, ⌘K searches (what people search for) |
| Store | Product views, Buy clicks, checkouts started, payments, failed or abandoned checkouts, downloads, coupon use |
| Revenue | Revenue (NGN and USD), orders, average order value, revenue per product, per source, per country, conversion rate per product |
| Leads | Contact form starts vs submits, messages by service and budget, which source brought each lead |
| Performance | Real-user Web Vitals per page (LCP, INP, CLS, TTFB) at the 75th percentile, split by phone vs desktop |

**Dashboard screens**

1. **Overview:** KPI cards (visitors, page views, bounce rate, avg. session, orders, revenue, conversion rate), each with % change vs the previous period and a small trend line; a main chart over time you can switch between metrics.
2. **Realtime:** visitors on the site right now, which pages they're on, where they came from, and a live feed of events ("Someone in Abuja viewed n8n Starter Pack · 12s ago").
3. **Pages:** sortable table of every page with views, visitors, time on page, scroll depth, exit rate.
4. **Sources:** referrers, social, search, UTM campaigns, each with visitors, conversion rate and revenue.
5. **Audience:** world map shaded by visitors, top countries and cities, devices, browsers, OS, screen sizes.
6. **Store funnel:** Product view → Buy click → Checkout started → Paid → Downloaded, with the drop-off at each step, filterable by product; revenue charts and top products.
7. **Engagement:** click counts for every CTA and social link, scroll depth, search terms, contact form funnel.
8. **Performance:** Web Vitals per page with good / needs work / poor ratings.

**Controls on every screen:** date range (today, 7d, 30d, 90d, 12 months, custom), compare to previous period, filter by any value (click a country, page or source to filter everything by it), CSV export.

**Extras:** weekly email report every Monday; alerts by email for a sale, a traffic spike, or a page that starts throwing 404s.

**Privacy and accuracy:** no cookies; visitors get a random anonymous ID; IP addresses are never stored (country and city come from the hosting provider's headers); bots and your own admin visits are filtered out; Do Not Track / Global Privacy Control are respected. Payments are recorded server-side from the Paystack webhook, so revenue numbers are exact even with ad blockers.

## Responsiveness

The site and the admin are both built mobile first and must work perfectly from a 360px phone to a 1440px+ screen.

**Public site**

- Every layout defined for 4 widths: phone (< 768), tablet (768–1023), laptop (1024–1279), desktop (1280+).
- Hero: two columns on laptop and up; on phones the drawing moves below the buttons and the headline drops from 64px to 40px.
- Work rows, product grid and pillar columns go from 3 columns → 2 (tablet) → 1 (phone).
- Product page: buy panel is sticky on the right on desktop; on phones it becomes a sticky bottom bar with price + Buy.
- Social rails show from 1280px; below that the icons move into the menu and footer.
- Tap targets at least 44px, no hover-only features, images sized per screen through Cloudinary.

**Admin**

- Desktop: fixed sidebar + wide tables. Tablet: sidebar collapses to icons. Phone: sidebar becomes a slide-out menu, with a bottom bar for Products, Analytics, Orders and Messages.
- Tables turn into stacked cards on phones (cover, name, price, status, actions).
- Product editor goes single-column on phones, with photo upload straight from the camera, so you can add a product from your phone in two minutes.
- Analytics charts stack in one column; KPI cards in a 2-column grid; the map becomes a country list.

**Tested on:** iPhone SE and iPhone 15 sizes, a mid-range Android (e.g. Samsung A-series), iPad, a 13" laptop and a 27" monitor, in Chrome, Safari and Firefox.

## Protection against fraud and cheating

Every common way people cheat digital stores is blocked on the server, where they can't touch it.

| How someone might cheat | What stops it |
| --- | --- |
| Changing the price in the browser | Price is always read from the database; the webhook rejects any payment whose amount or currency doesn't match the order. |
| Faking a "payment successful" page or URL | Downloads unlock **only** after the Paystack webhook (signature-checked) or a server-side Paystack verify call. The success URL alone unlocks nothing. |
| Replaying the same payment twice | Each Paystack reference is processed once (idempotent); duplicates are ignored. |
| Sharing the download link | Links expire after 72 hours and 5 downloads, are tied to one order, and the file URL itself expires after 5 minutes. If one link is used from more than 3 countries or devices, it locks and you get an alert. |
| Reselling your files | PDFs and guides are stamped with the buyer's email on every page at download time; zips include a license file with the buyer's email and order number. Previews are never the full file. |
| Guessing file locations | Product files are private Cloudinary assets; there are no public URLs to find. |
| Coupon abuse | Coupons have max uses, expiry dates and one use per email, all checked on the server. |
| Fake chargebacks ("I never got it") | Each order keeps evidence: payment record, email sent, and a download log (time, country, device). You can answer a Paystack dispute in minutes. |
| Fake reviews | Only verified buyers, one review per order, and you approve each one. |
| Bots spamming forms or free products | Cloudflare Turnstile, rate limits, and email confirmation for free products. |
| Someone breaking into your admin | Strong password + 2FA, lock after 5 failed tries, email alert on every new login, backup codes, sessions you can log out remotely. |
| Losing everything | Daily database backups with point-in-time restore (Neon) plus a weekly export; product files backed up outside Cloudinary. |

## Legal basics

The goal is to stay out of trouble with buyers, Paystack and the data protection regulator. This is general guidance, not legal advice: have a Nigerian lawyer review the policy pages once (a one-time, low-cost job).

**Pages to add** (linked in the footer and at checkout, editable in the admin with a "last updated" date): `/privacy`, `/terms`, `/refunds`, `/license`. They're small and required, so they're the only routes added.

- **Privacy policy:** what you collect (email and order details for purchases, contact form messages, anonymous analytics with no cookies), why, how long you keep it, who processes it (Paystack, Cloudinary, Resend, Vercel, Neon), and how people can ask to see or delete their data (by email, answered within 30 days). Nigeria's [Data Protection Act 2023](https://fpf.org/blog/nigerias-new-data-protection-act-explained/) applies to sites handling Nigerians' data. Special registration duties apply to "data controllers of major importance" ([NDPC directive](https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf)); a small personal store is unlikely to qualify, but confirm against the NDPC's current thresholds.
- **Terms of use:** who you are, how purchases work, delivery is instant digital download, limits of liability, Nigerian law applies.
- **Refund policy:** because files are delivered instantly, no refunds after download, except when a file is broken or not as described (then a fix or a full refund within 14 days). Paystack and card networks expect a clear refund policy to be visible.
- **License:** what buyers may do (use in their own and client projects) and may not do (resell, share or redistribute the files). Shown on every product page and included in every download.
- **At checkout:** a required checkbox "I agree to the Terms, Refund policy and License", with the time of agreement saved on the order.

**Other things to sort out**

- [ ] Complete Paystack's business verification; they may ask for a registered business name (CAC) to raise limits. Check their current requirements.
- [ ] Only sell what you own: no paid fonts, icons, templates or third-party logos inside products; keep open-source license notices (e.g. MIT) where you use open-source code.
- [ ] Keep records of income and ask an accountant about tax on your sales.
- [ ] Use only real testimonials and real numbers on the site (also a consumer-protection issue).

## Digital products store

Buyers pay, the payment provider confirms through a webhook, and only then does the buyer get a private, expiring download link. No one can find or share the files publicly.

**Payments**

- **Paystack** as the main option: takes Naira and international cards, and pays out to Nigerian banks.
- Optional second option for USD buyers abroad (e.g., a merchant-of-record service like Lemon Squeezy or Polar). Confirm it supports payouts to you in Nigeria before adding it.
- Show prices in NGN or USD based on the visitor's country, with a toggle.

**Purchase flow**

1. Buyer clicks **Buy now** and enters an email (no account needed).
2. API route `POST /api/checkout` creates a pending order in Postgres and starts a Paystack transaction.
3. Buyer pays on Paystack.
4. Paystack calls `POST /api/webhooks/paystack`. The route checks the signature (HMAC SHA-512 with your secret key), confirms the amount, and marks the order paid. It ignores duplicate events.
5. The site creates a download token (valid 72 hours, max 5 downloads) and emails it via Resend.
6. `/downloads/[token]` checks the token, then gives a **signed Cloudinary URL** that expires in a few minutes.

**Storing product files**

- Upload product files to Cloudinary as **authenticated (private)** assets. Never public links.
- Preview images and cover art stay public and optimized.

**Extras that make it feel premium**

- Discount codes, "pay what you want" for free products (email capture), bundles.
- Reviews only from verified buyers.
- Order lookup: buyers enter their email to get their links again.
- Admin sales dashboard: revenue, top products, recent orders.

**Product ideas for your niche:** n8n workflow packs, Next.js + Postgres starter kits, home lab setup guides, Linux server hardening checklists, automation templates for small businesses, network diagram templates.

## Architecture

One Next.js app does everything: the pages, the API routes and the admin. It sits behind Cloudflare and talks to five managed services, so there is no separate backend server to maintain.

&#91;embedded content: System architecture · one Next.js app, five services\]

The API routes (highlighted) are the only part that writes data or touches money, so that is where validation, rate limits and signature checks live.

## Database schema

Postgres with **Prisma** and migrations, hosted on Neon or Supabase. Nineteen tables; the store group is the heart of it.

| Group | Table | Key fields |
| --- | --- | --- |
| Store | `Product` | id, slug, title, summary, description, whatsInside, priceNGN, priceUSD, isFree, category, coverId, galleryIds\[\], fileId, featured, status (draft, published, hidden) |
| Store | `Order` | id, email, productId, amount, currency, status (pending, paid, refunded), provider, providerRef, couponId, createdAt |
| Store | `DownloadToken` | id, orderId, tokenHash, expiresAt, downloadsLeft |
| Store | `Review` | id, productId, orderId, rating, comment, approved |
| Store | `Coupon` | id, code, percentOff, maxUses, uses, expiresAt |
| Site content | `SiteSettings` | name, tagline, logoIds, socials, contact, availability, cvFileId |
| Site content | `Section` | id, page (home, about), type, order, visible, data (JSON, Zod-validated) |
| Site content | `SeoMeta` | id, page or productId, title, description, ogImageId |
| Site content | `Media` | id, cloudinaryId, url, width, height, alt, private |
| Portfolio | `Project` | id, slug, title, pillar, summary, content, stack\[\], coverId, galleryIds\[\], results, liveUrl, repoUrl, order |
| Portfolio | `Certification`, `Testimonial` | Certifications with progress; client quotes with visible flag |
| Inbox | `Message` | id, name, email, service, budget, body, status, createdAt |
| Admin | `User`, `Session`, `AuditLog` | Your login (Argon2 hash, 2FA secret), sessions, record of admin actions |

**Analytics tables:** `Event` (id, ts, type, path, visitorId, sessionId, referrer, utmSource, utmMedium, utmCampaign, country, region, city, device, browser, os, screen, lang, theme, props JSON, value) with indexes on ts, type and path; and `DailyStat` (date, metric, dimension, key, count, sum), a nightly rollup that keeps the dashboard fast. Raw events kept 13 months. For fraud checks, \`DownloadLog\` (orderId, ts, country, device) records every download, and \`Order\` also stores \`termsAcceptedAt\`.

## SEO strategy

The goal is to own searches for **Abdul-Quddus Inda**, "Abdul Quddus Inda" and **inda.dev**, then rank for service searches like "n8n automation developer Nigeria" and "Next.js backend developer", and get cited by AI search tools.

Use one exact name everywhere: page titles follow `Page — Abdul-Quddus Inda`, and the `Person` schema lists `name: "Abdul-Quddus Inda"` with `alternateName: ["Abdul Quddus Inda", "Inda"]` and `url: "https://inda.name.ng"`.

**About the domain:** `inda.name.ng` is a Nigerian domain, so Google treats it as aimed at Nigeria. That helps local searches. To keep reaching clients abroad, write prices and copy for both audiences, show USD on products, and link the site from GitHub, LinkedIn and X. Use a matching email such as `hello@inda.name.ng`.

**Technical SEO**

- Use the App Router `generateMetadata` on every page: unique title (under 60 characters), description (under 155), canonical URL.
- Auto-generated **Open Graph images** per page with `next/og`: green background, your logo, page title. Every shared link looks branded on WhatsApp, X and LinkedIn.
- `sitemap.ts` and `robots.ts` generated from the database, so new posts and products appear automatically.
- Static generation + Incremental Static Regeneration, so pages are fast HTML that Google can read without JavaScript.
- `next/image` with Cloudinary for responsive, compressed images (AVIF/WebP), always with alt text.
- Clean URLs (`/work/school-management-api`, not IDs). Redirect old slugs if you rename.
- Target Core Web Vitals: LCP under 2.5s, CLS under 0.1, INP under 200ms, on mobile.

**Structured data (JSON-LD)**

- `Person` on home and about (name, job title, skills, social profiles via `sameAs`).
- `WebSite` on the homepage.
- `Product` + `Offer` + `AggregateRating` on product pages (shows price and stars in Google).
- `CreativeWork` on case studies; `BreadcrumbList` on all inner pages.

**Content SEO**

- The homepage "What I do" section carries the service keywords (web and backend development, AI automation, network setup).
- Each product page is written to rank on its own: clear title, who it's for, what's inside, FAQs.
- Each case study names the problem, industry and stack, which matches what clients search for.
- Add an `llms.txt` file and plain, well-structured text so AI assistants can read and cite you.

**Off-site**

- Google Search Console and Bing Webmaster Tools from day one.
- Same name, photo and bio on GitHub, LinkedIn, X and dev.to, all linking back to the site.
-

## Performance, accessibility and security

A cybersecurity portfolio will get probed, so the site itself must be hardened. Treat it as a project you can show off: mention it on your About page and link your security headers score.

**Performance (so the effects never feel slow)**

- No heavy visual libraries: no Three.js, GSAP or smooth-scroll hijacking. Motion is CSS and Framer Motion only.
- Keep first-load JavaScript under \~150 KB; load the command menu and the admin editor only when needed.
- Pause animations that are off-screen.
- Target Lighthouse 90+ on mobile for Performance, Accessibility, Best Practices and SEO.

**Accessibility**

- Full keyboard navigation, visible green focus rings, skip-to-content link.
- Respect reduced-motion settings; never put key text only inside animations or images.
- Contrast checked in both themes.

**Security**

- Security headers: strict Content-Security-Policy, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors none. Aim for an A+ on securityheaders.com.
- Validate every API input with **Zod**; parameterized queries only (Prisma does this).
- Rate-limit contact, checkout and login routes (Upstash Redis); add Cloudflare Turnstile to forms instead of a visible CAPTCHA.
- Verify webhook signatures; never trust amounts from the browser.
- Admin: hashed passwords (Argon2), 2FA, short sessions, httpOnly secure cookies, CSRF protection, login alerts.
- Secrets only in environment variables; Dependabot or Renovate for dependency updates; `npm audit` in CI.
- Publish `/.well-known/security.txt` with your contact. It's a small detail security people notice.
-

**Hosting**

- Vercel for the Next.js app (or a VPS with Docker + Caddy if you want to show off your server skills), Cloudflare in front for DNS and protection.
- Analytics: Vercel Analytics or self-hosted Umami (privacy-friendly, no cookie banner needed).
- Error tracking with Sentry; uptime monitoring with your own Uptime Kuma.

## Build roadmap

Five phases, about 8 weeks part-time, with launch at the end of week 8.

1. **Foundation (week 1)**
   - Logo rebuilt as SVG with all variants; design tokens, fonts and base components in Tailwind + shadcn/ui.
   - Next.js (App Router, TypeScript), Prisma + Postgres, Cloudinary, GitHub repo, Vercel deploys.
2. **Public site (weeks 2–3)**
   - Homepage, case study pages, About, Contact, 404, all rendering from the database.
3. **Store (weeks 3–5)**
   - Products list and pages, Paystack checkout, webhook, secure downloads, emails, coupons, reviews. Tested in Paystack test mode first.
4. **Admin + analytics (weeks 5–7)**
   - Login + 2FA, the Products screen and two-minute product flow, sales overview, the Analytics dashboard, then settings, homepage sections, work and about.
5. **Launch (week 8)**
   - SEO metadata, share images, sitemap, JSON-LD, Search Console; security-headers and Lighthouse audits; test on a low-end Android phone and an iPhone. **Launch.**

## What I need from you

- [ ]
- [ ] 3–5 projects to feature, with a sentence on the problem and result for each.
- [ ]
- [ ] Certifications or courses done or in progress.
- [ ] 2–3 digital products you want to sell first, with prices.
- [ ] A professional photo of yourself for About.
- [ ] Social links and preferred contact channels (email, WhatsApp, Cal.com).

Logo and name are in. Next step: a design mockup of the homepage (desktop and mobile) in this style, so you can approve the look before any code.
