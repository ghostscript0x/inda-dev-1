# CLAUDE.md

Portfolio + digital store + admin for Abdul-Quddus Inda (brand inda.dev, domain inda.name.ng). The product plan is `Docs-File.md`; follow it.

## Commands
- `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint`
- `npm run db:migrate` (new migration) · `npm run db:deploy` · `npm run db:seed`
- `npm run admin:create -- email [--demo]`

## Rules
- Next.js 16: `params`/`searchParams` are Promises; middleware is `src/proxy.ts`; `revalidateTag(tag, "max")` (two args).
- Prisma 7: client is generated to `src/generated/prisma` (import from `@/generated/prisma/client`); DB access only through `@/lib/db`. Clear nullable JSON with `Prisma.DbNull`.
- Money is stored in minor units (kobo/cents). Prices are always read from the DB, never from the request.
- Every admin mutation goes through `adminAction()` in `src/app/admin/actions/common.ts` (auth, demo read-only, audit log) and calls `publish(TAGS.x)` for affected public data.
- Every API input is validated with Zod (`readJson` in `src/lib/api.ts`); rate-limit public POST routes.
- Public reads go through `src/lib/data.ts` (cached + tagged, draft-aware).
- New homepage/About section type = add it to `sectionDefs` in `src/lib/content.ts` (schema + fields) and render it in the page switch.
- Design: tokens in `src/app/globals.css` (dark default, one accent `#00EFAE`, light-mode link color `#007A5A`). Geist Sans/Mono. 8px spacing, 150–300 ms ease-out motion, respect reduced motion. No glow, gradients-as-decoration, emoji or stock art.
- Analytics: no cookies, never store IPs. Tracker is `public/t.js`; ingest is `/api/e` (whitelisted event types).
- Only real testimonials, numbers and projects on the live site.
