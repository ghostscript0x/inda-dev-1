import { getSettings } from "@/lib/data";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const revalidate = 86400;

/** RFC 9116 security.txt. Expires is kept one year ahead automatically. */
export async function GET() {
  const { email } = await getSettings();
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const body = `Contact: mailto:${email}
Expires: ${expires}
Preferred-Languages: en
Canonical: ${site}/.well-known/security.txt
Policy: ${site}/.well-known/security.txt

# Found something? Thanks for looking. Please report it privately by email,
# give me reasonable time to fix it, and don't access other people's data.
# Valid reports are credited (if you want) on the About page.
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
