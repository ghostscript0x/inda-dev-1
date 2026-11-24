/**
 * Create (or reset the password of) an admin account.
 *
 *   npm run admin:create -- you@example.com
 *   npm run admin:create -- demo@inda.name.ng --demo     (read-only demo account, no 2FA)
 *
 * The password is read from ADMIN_PASSWORD, or prompted for (hidden) if not set.
 * 2FA setup is forced on first sign-in for non-demo accounts.
 */
import "dotenv/config";
import { createInterface } from "node:readline";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function promptHidden(q: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  const answer = await new Promise<string>((resolve) => {
    rl.question(q, resolve);
    out._writeToOutput = (s: string) => {
      if (s.includes(q)) out.output.write(s);
    };
  });
  rl.close();
  process.stdout.write("\n");
  return answer;
}

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => a.includes("@"))?.toLowerCase();
  const demo = args.includes("--demo");
  if (!email) throw new Error("Usage: npm run admin:create -- you@example.com [--demo]");
  const password = process.env.ADMIN_PASSWORD || (await promptHidden("Password (min 12 chars): "));
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, failedLogins: 0, lockedUntil: null },
    create: { email, passwordHash, isDemo: demo },
  });
  await db.auditLog.create({ data: { userId: user.id, action: "admin.create_or_reset", meta: { demo } } });
  console.log(`${demo ? "Demo" : "Admin"} account ready: ${email}. Sign in at /admin/login${demo ? "" : " and set up 2FA"}.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
