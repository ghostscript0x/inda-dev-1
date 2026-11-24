import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { ContactCta, Pillars, ProductsSection, Proof, WorkList } from "@/components/sections/home-sections";
import { getFeaturedProducts, getMedia, getProjects, getSections, getSeo, getSettings, getTestimonials, type SectionBlock } from "@/lib/data";
import { jsonLd, pageMeta, PERSON } from "@/lib/seo";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("/");
  const media = seo?.ogImageId ? await getMedia([seo.ogImageId]) : {};
  return pageMeta({
    title: seo?.title ?? undefined,
    description: seo?.description ?? "Software engineer building secure, automated systems: web and backend development, AI automation, and network & security engineering.",
    path: "/",
    ogImage: seo?.ogImageId ? media[seo.ogImageId]?.url : null,
  });
}

export default async function HomePage() {
  const [sections, about, settings, projects, products, testimonials] = await Promise.all([getSections("home"), getSections("about"), getSettings(), getProjects(), getFeaturedProducts(3), getTestimonials()]);
  // The hero reuses the photo uploaded for the About page.
  const story = about.find((s) => s.type === "story");
  const photoId = story?.type === "story" ? story.data.photoId : null;
  const media = await getMedia([...projects.map((p) => p.coverId), ...products.map((p) => p.coverId), photoId].filter((x): x is string => Boolean(x)));

  const hero = sections.find((s) => s.type === "hero");
  const pillars = sections.find((s) => s.type === "pillars");
  const render = (s: SectionBlock) => {
    switch (s.type) {
      case "hero":
        return (
          <Hero
            key={s.id}
            data={s.data}
            name={settings.name || s.data.name}
            available={settings.availability}
            availabilityText={settings.availabilityText}
            pillars={pillars?.type === "pillars" ? pillars.data.items : undefined}
            photo={photoId ? media[photoId] : null}
            email={settings.email}
            socials={settings.socials}
          />
        );
      case "work":
        return <WorkList key={s.id} data={s.data} projects={projects} media={media} />;
      case "pillars":
        return <Pillars key={s.id} data={s.data} />;
      case "products":
        return <ProductsSection key={s.id} data={s.data} products={products} media={media} />;
      case "proof":
        return <Proof key={s.id} data={s.data} testimonials={testimonials} />;
      case "contact":
        return <ContactCta key={s.id} data={s.data} settings={settings} />;
      default:
        return null;
    }
  };

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON,
    alternateName: ["Abdul Quddus Inda", "Inda"],
    url: env.siteUrl,
    jobTitle: "Software Engineer",
    description: hero?.type === "hero" ? hero.data.headline : undefined,
    email: `mailto:${settings.email}`,
    knowsAbout: pillars?.type === "pillars" ? pillars.data.items.flatMap((p) => p.capabilities) : undefined,
    sameAs: settings.socials.filter((s) => /^https?:/.test(s.href) && s.network !== "whatsapp").map((s) => s.href),
  };
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: "inda.dev", alternateName: PERSON, url: env.siteUrl };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(person)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(website)} />
      {sections.map(render)}
    </>
  );
}
