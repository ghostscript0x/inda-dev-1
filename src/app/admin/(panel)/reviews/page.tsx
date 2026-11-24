import { Check, Star, X } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { FilterLinks } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { Badge, Empty } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { moderateReview } from "@/app/admin/actions/store";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const approved = show === "approved";
  const [reviews, pending] = await Promise.all([
    db.review.findMany({ where: { approved }, orderBy: { createdAt: "desc" }, include: { product: { select: { title: true } }, order: { select: { email: true } } }, take: 100 }),
    db.review.count({ where: { approved: false } }),
  ]);
  return (
    <>
      <PageHeader title="Reviews" description="Reviews from verified buyers. Nothing appears on the site until you approve it." />
      <div className="mb-4">
        <FilterLinks
          base="/admin/reviews"
          param="show"
          current={show}
          options={[
            { value: "", label: "Waiting", count: pending },
            { value: "approved", label: "Approved" },
          ]}
        />
      </div>
      {reviews.length === 0 ? (
        <Empty title={approved ? "No approved reviews yet" : "Nothing to approve"} />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-surface p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-14">
                <span className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={i < r.rating ? "size-3.5 fill-accent-text text-accent-text" : "size-3.5 text-border-strong"} aria-hidden />
                  ))}
                </span>
                <span className="font-medium">{r.name}</span>
                <span className="text-muted">on {r.product.title}</span>
                <Badge tone="accent">verified</Badge>
                <span className="ml-auto font-mono text-[0.75rem] text-subtle">{formatDate(r.createdAt)}</span>
              </div>
              <p className="mt-3 text-14 leading-relaxed">{r.comment}</p>
              <p className="mt-2 font-mono text-[0.75rem] text-subtle">{r.order.email}</p>
              <div className="mt-4 flex gap-2">
                {!r.approved && (
                  <ActionButton size="sm" action={moderateReview.bind(null, r.id, true)}>
                    <Check aria-hidden /> Approve
                  </ActionButton>
                )}
                <ActionButton size="sm" variant="ghost" action={moderateReview.bind(null, r.id, false)} confirmText="Remove this review?">
                  <X aria-hidden /> Remove
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
