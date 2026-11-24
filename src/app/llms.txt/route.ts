import { getProducts, getProjects, getSettings } from "@/lib/data";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const revalidate = 3600;

/** Plain-text summary for AI assistants (llmstxt.org format). */
export async function GET() {
  const [settings, projects, products] = await Promise.all([getSettings(), getProjects(), getProducts()]);
  const body = `# Abdul-Quddus Inda (inda.dev)

> ${settings.tagline}

${settings.bio}

- Website: ${site}
- Email: ${settings.email}
- Services: web and backend development (Next.js, Node.js, Postgres, APIs), AI automation (n8n, AI agents, workflow automation), network and security engineering (home lab, server hardening, network setup).
- Based in Nigeria, working with clients worldwide.

## Case studies
${projects.map((p) => `- [${p.title}](${site}/work/${p.slug}): ${p.summary} Result: ${p.result}`).join("\n")}

## Products
${products.map((p) => `- [${p.title}](${site}/products/${p.slug}): ${p.summary}`).join("\n")}

## Pages
- [About](${site}/about): background, skills, certifications, home lab.
- [Contact](${site}/contact): project enquiries, booking and WhatsApp.
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
