import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { NotFoundTracker } from "@/components/site/not-found-tracker";
import { buttonClass } from "@/components/ui/button";
import { getSearchIndex, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default async function NotFound() {
  const [settings, index] = await Promise.all([getSettings(), getSearchIndex()]);
  return (
    <>
      <Header index={index} socials={settings.socials} />
      <main id="main" className="container-page flex min-h-[60vh] flex-col justify-center py-24">
        <p className="font-mono text-14 text-accent-text">404</p>
        <h1 className="mt-3 text-40 md:text-64">This page doesn’t exist.</h1>
        <p className="measure mt-4 text-18 text-muted">
          The link may be old or mistyped. Press <kbd className="rounded border border-border px-1.5 font-mono text-14">Ctrl K</kbd> to search, or try one of these:
        </p>
        <nav aria-label="Helpful links" className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className={buttonClass()}>
            <ArrowLeft aria-hidden /> Home
          </Link>
          <Link href="/#work" className={buttonClass({ variant: "outline" })}>
            Work
          </Link>
          <Link href="/products" className={buttonClass({ variant: "outline" })}>
            Products
          </Link>
          <Link href="/contact" className={buttonClass({ variant: "outline" })}>
            Contact
          </Link>
        </nav>
        <NotFoundTracker />
      </main>
      <Footer settings={settings} />
      <Script src="/t.js" strategy="afterInteractive" />
    </>
  );
}
