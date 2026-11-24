import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// In dev the client is kept on globalThis so hot reloads don't open new connection pools.
// It remembers which generated PrismaClient class built it: after `prisma generate` the class
// changes, and the old instance (with the old schema) is replaced instead of reused.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaClass?: typeof PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set. Add it to .env (see .env.example).");
  // Optional pool cap (e.g. 1–5 on serverless, or for single-connection local databases).
  const max = Number(process.env.DATABASE_POOL_MAX) || undefined;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max }) });
}

const stale = globalForPrisma.prisma && globalForPrisma.prismaClass !== PrismaClient;
if (stale) void globalForPrisma.prisma!.$disconnect().catch(() => undefined);

export const db = !stale && globalForPrisma.prisma ? globalForPrisma.prisma : createClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaClass = PrismaClient;
}
