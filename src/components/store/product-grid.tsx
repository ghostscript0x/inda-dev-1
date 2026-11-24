"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import { PRODUCT_CATEGORIES } from "@/lib/content";
import type { MediaInfo, ProductCard as Card } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ProductGrid({ products, media }: { products: Card[]; media: Record<string, MediaInfo> }) {
  const [cat, setCat] = useState<string>("all");
  const present = Object.entries(PRODUCT_CATEGORIES).filter(([k]) => products.some((p) => p.category === k));
  const shown = cat === "all" ? products : products.filter((p) => p.category === cat);

  return (
    <>
      {present.length > 1 && (
        <div role="tablist" aria-label="Filter by category" className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {[["all", "All"] as const, ...present].map(([key, label]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={cat === key}
              onClick={() => setCat(key)}
              className={cn(
                "h-9 shrink-0 rounded-full border px-4 text-14 transition-colors duration-150",
                cat === key ? "border-fg bg-fg text-bg" : "border-border text-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {label}
              <span className="ml-1.5 font-mono text-[0.75rem] opacity-60">{key === "all" ? products.length : products.filter((p) => p.category === key).length}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => (
          <ProductCard key={p.id} product={p} cover={p.coverId ? media[p.coverId] : undefined} priority={i < 3} />
        ))}
      </div>
    </>
  );
}
