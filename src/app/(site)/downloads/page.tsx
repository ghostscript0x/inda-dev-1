import type { Metadata } from "next";
import { OrderLookup } from "@/components/store/order-lookup";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({ title: "Find my downloads", description: "Lost your download link? Enter your email and get fresh links for every product you bought.", path: "/downloads", noindex: true });

export default function DownloadsLookupPage() {
  return (
    <div className="container-page max-w-xl pt-16 md:pt-24">
      <p className="eyebrow">Order lookup</p>
      <h1 className="mt-3 text-32 md:text-40">Find my downloads</h1>
      <p className="mt-3 text-muted">Enter the email you used at checkout. If it has orders, we’ll email fresh download links for each one.</p>
      <OrderLookup />
    </div>
  );
}
