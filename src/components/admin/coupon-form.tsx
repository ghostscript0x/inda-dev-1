"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createCoupon } from "@/app/admin/actions/store";
import { useRun } from "./product-row-actions";
import { newCouponCode } from "@/lib/coupon-code";

export function CouponForm({ initialCode }: { initialCode: string }) {
  const { run, pending } = useRun();
  const [code, setCode] = useState(initialCode);
  const [pct, setPct] = useState("20");
  const [max, setMax] = useState("");
  const [exp, setExp] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createCoupon({ code, percentOff: Number(pct), maxUses: max ? Number(max) : null, expiresAt: exp || null }), () => setCode(newCouponCode()));
      }}
    >
      <Field label="Code" htmlFor="cp-code" hint="Generated for you. Type over it for a memorable one like LAUNCH20.">
        <div className="flex gap-2">
          <Input id="cp-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="font-mono uppercase" required />
          <button type="button" onClick={() => setCode(newCouponCode())} className={buttonClass({ variant: "outline", size: "icon" })} aria-label="Generate a new code" title="Generate a new code">
            <RefreshCw />
          </button>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="% off" htmlFor="cp-pct">
          <Input id="cp-pct" type="number" min={1} max={100} value={pct} onChange={(e) => setPct(e.target.value)} required />
        </Field>
        <Field label="Max uses" htmlFor="cp-max" hint="Blank = unlimited">
          <Input id="cp-max" type="number" min={1} value={max} onChange={(e) => setMax(e.target.value)} />
        </Field>
      </div>
      <Field label="Expires" htmlFor="cp-exp" hint="Blank = never">
        <Input id="cp-exp" type="date" value={exp} onChange={(e) => setExp(e.target.value)} />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        Create coupon
      </Button>
    </form>
  );
}
