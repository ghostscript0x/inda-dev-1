import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // CLI only (migrate, seed). Migrations need a direct connection: on Neon/Supabase set DIRECT_URL to the
  // non-pooled URL. The app itself connects through DATABASE_URL (src/lib/db.ts).
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || "" },
});
