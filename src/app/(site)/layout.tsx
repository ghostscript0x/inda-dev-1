import Script from "next/script";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SocialRails } from "@/components/site/social-rails";
import { ConsoleNote } from "@/components/site/console-note";
import { DraftBanner } from "@/components/site/draft-banner";
import { getSearchIndex, getSettings, isDraft } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, index, draft] = await Promise.all([getSettings(), getSearchIndex(), isDraft()]);
  return (
    <>
      {draft && <DraftBanner />}
      <Header index={index} socials={settings.socials} />
      <SocialRails socials={settings.socials} email={settings.email} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer settings={settings} />
      <ConsoleNote email={settings.email} />
      {!draft && <Script src="/t.js" strategy="afterInteractive" />}
    </>
  );
}
