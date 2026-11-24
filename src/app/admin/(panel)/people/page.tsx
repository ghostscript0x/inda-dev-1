import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { PeopleEditor } from "@/components/admin/people-editor";

export const metadata = { title: "Certifications & quotes" };

export default async function PeoplePage() {
  const [certs, quotes] = await Promise.all([db.certification.findMany({ orderBy: { order: "asc" } }), db.testimonial.findMany({ orderBy: { order: "asc" } })]);
  return (
    <>
      <PageHeader title="Certs & quotes" description="Certifications on the About page and client quotes on the homepage." />
      <PeopleEditor
        certs={certs.map((c) => ({ id: c.id, name: c.name, issuer: c.issuer, status: c.status as "done", progress: c.progress, date: c.date, url: c.url ?? "" }))}
        quotes={quotes.map((q) => ({ id: q.id, quote: q.quote, name: q.name, role: q.role, visible: q.visible }))}
      />
    </>
  );
}
