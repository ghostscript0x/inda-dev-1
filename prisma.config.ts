import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Migrations need a direct (non-pooled) connection: Prisma takes an advisory lock, which
 * connection poolers can't hold. Use DIRECT_URL when set; otherwise, for a Neon pooled URL
 * (host contains "-pooler."), use the same URL without "-pooler", which is Neon's direct endpoint.
 * The app itself keeps connecting through DATABASE_URL (src/lib/db.ts).
 */
function migrationUrl() {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  const url = process.env.DATABASE_URL ?? "";
  return url.replace(/(@[^/]*?)-pooler\./, "$1.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: migrationUrl() },
});
