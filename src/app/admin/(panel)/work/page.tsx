import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { WorkList } from "@/components/admin/work-list";
import { ButtonLink } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";

export const metadata = { title: "Work" };

export default async function WorkAdmin() {
  const projects = await db.project.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true, slug: true, pillar: true, result: true, published: true } });
  return (
    <>
      <PageHeader
        title="Case studies"
        description="Shown on the homepage in this order. Three to five strong ones is ideal."
        actions={
          <ButtonLink href="/admin/work/new">
            <Plus aria-hidden /> New case study
          </ButtonLink>
        }
      />
      {projects.length ? <WorkList projects={projects} /> : <Empty title="No case studies yet" action={<ButtonLink href="/admin/work/new">Write the first one</ButtonLink>} />}
    </>
  );
}
