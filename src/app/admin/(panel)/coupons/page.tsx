import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/shell";
import { Cell, Panel, ResponsiveTable, Row } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupon-form";
import { ActionButton } from "@/components/admin/action-button";
import { Badge, Empty } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { toggleCoupon } from "@/app/admin/actions/store";
import { newCouponCode } from "@/lib/coupon-code";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <>
      <PageHeader title="Coupons" description="Discount codes for the store. Each buyer can use a code once." />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {coupons.length === 0 ? (
            <Empty title="No coupons yet" />
          ) : (
            <ResponsiveTable head={["Code", "Discount", "Used", "Expires", "Status", ""]}>
              {coupons.map((c) => {
                const expired = c.expiresAt && c.expiresAt < now;
                const used = c.maxUses !== null && c.uses >= c.maxUses;
                return (
                  <Row key={c.id}>
                    <Cell primary className="font-mono font-medium">
                      {c.code}
                    </Cell>
                    <Cell className="font-mono">−{c.percentOff}%</Cell>
                    <Cell label="Used" className="font-mono">
                      {c.uses}
                      {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                    </Cell>
                    <Cell label="Expires" className="font-mono text-[0.8125rem]">
                      {c.expiresAt ? formatDate(c.expiresAt) : "Never"}
                    </Cell>
                    <Cell>{!c.active ? <Badge tone="muted">disabled</Badge> : expired ? <Badge tone="muted">expired</Badge> : used ? <Badge tone="muted">used up</Badge> : <Badge tone="accent">active</Badge>}</Cell>
                    <Cell className="text-right">
                      <ActionButton variant="ghost" size="sm" action={toggleCoupon.bind(null, c.id, !c.active)}>
                        {c.active ? "Disable" : "Enable"}
                      </ActionButton>
                    </Cell>
                  </Row>
                );
              })}
            </ResponsiveTable>
          )}
        </div>
        <div className="lg:col-span-4">
          <Panel title="New coupon">
            <CouponForm initialCode={newCouponCode()} />
          </Panel>
        </div>
      </div>
    </>
  );
}
