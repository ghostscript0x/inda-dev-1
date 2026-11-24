# inda.dev

Portfolio, digital store and admin for **Abdul-Quddus Inda**, live at [inda.name.ng](https://inda.name.ng). One Next.js app: public site, API routes, admin, self-hosted analytics. The plan it implements is in [`Docs-File.md`](./Docs-File.md).

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Prisma 7 + Postgres (Neon/Supabase) · Zod · Motion · Radix · cmdk · Lucide · Paystack · Cloudinary · Resend · Upstash · Cloudflare Turnstile.

## Run it locally

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, AUTH_SECRET, CRON_SECRET at minimum
npm run db:deploy             # create the tables (prisma/migrations)
npm run db:seed               # starting content (safe to re-run)
npm run admin:create -- you@example.com
npm run dev                   # http://localhost:3000 · admin at /admin
```

Without Cloudinary, Resend, Turnstile or Upstash keys the app still runs locally: uploads go to `public/uploads` + `storage/`, emails print to the terminal, spam checks are skipped, rate limits are in memory. **All four are enforced in production**: the app refuses to send email, upload or verify forms without them rather than silently skipping.

## Deploy (Vercel)

1. Import the repo in Vercel, add every variable from `.env.example`.
2. Vercel runs `npm run vercel-build` automatically: it applies database migrations, adds the starting content on a brand-new database only (once the site is set up, deploys never add, change or delete content; it only creates the `ADMIN_EMAIL`/`ADMIN_PASSWORD` admin if that account doesn't exist), then builds. With a pooled `DATABASE_URL` (Neon/Supabase), also set `DIRECT_URL` to the direct connection for migrations.
3. Paystack dashboard → Settings → API Keys & Webhooks → webhook URL `https://inda.name.ng/api/webhooks/paystack`.
4. Cloudflare in front for DNS (proxied). Crons in `vercel.json` run daily (Hobby-plan safe).
5. Add the site to Google Search Console and Bing Webmaster Tools; submit `/sitemap.xml`.

## Where things are

| Path | What |
|---|---|
| `src/app/(site)` | Public pages: home, `/work/[slug]`, `/products`, `/about`, `/contact`, legal, downloads, checkout returns |
| `src/app/admin` | Admin: login + 2FA, products (main), orders, coupons, reviews, analytics, inbox, content, work, SEO, legal, settings, security, audit log |
| `src/app/api` | Checkout, Paystack webhook, secure downloads, contact, analytics ingest (`/api/e`), uploads, crons |
| `src/lib/content.ts` | Section block types: Zod schema + admin form spec per type |
| `src/lib/data.ts` | Cached, draft-aware public reads (`revalidateTag` on publish) |
| `src/lib/store.ts` | Pricing, coupons, idempotent order fulfilment, download tokens |
| `src/lib/analytics-queries.ts` | Every dashboard query |
| `public/t.js` | The < 2 KB analytics tracker (no cookies) |
| `src/components/logo.tsx` | `<Logo />` (full, follows theme) and `<LogoMark />` (icon), from `inda-logo-kit` |
| `src/app/favicon.ico`, `icon.svg`, `apple-icon.png` · `public/logo/` | Browser/phone icons and the logo files (SVG + PNG) from `inda-logo-kit` |
| `prisma/schema.prisma` | 22 tables |

## Admin accounts

- `npm run admin:create -- you@example.com` creates an admin (or resets its password). 2FA setup is forced at first sign-in; backup codes are shown once.
- `npm run admin:create -- demo@inda.name.ng --demo` creates a **read-only** demo login you can share with clients (no 2FA, every change is refused).

## Security notes

Security headers (CSP, HSTS, frame-ancestors none…) are in `next.config.ts`. Payments are confirmed only by the signature-checked webhook or a server-side verify call; prices always come from the database; download links expire (72 h / 5 downloads), lock after 3 countries/devices, and PDFs/zips are stamped with the buyer's email.
