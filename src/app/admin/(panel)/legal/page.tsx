import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { LegalEditor } from "@/components/admin/legal-editor";

export const metadata = { title: "Legal pages" };

const SLUGS = [
  ["privacy", "Privacy policy"],
  ["terms", "Terms of use"],
  ["refunds", "Refund policy"],
  ["license", "License"],
] as const;

export default async function LegalAdmin() {
  const docs = await db.legalDoc.findMany();
  return (
    <>
      <PageHeader title="Legal pages" description="Privacy, terms, refunds and license. Linked in the footer and at checkout." />
      <LegalEditor
        docs={SLUGS.map(([slug, title]) => {
          const d = docs.find((x) => x.slug === slug);
          return { slug, title: d?.title ?? title, body: d?.body ?? "", updatedAt: d?.updatedAt.toISOString() ?? null };
        })}
      />
    </>
  );
}
