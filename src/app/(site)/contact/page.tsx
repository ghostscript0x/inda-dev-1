import type { Metadata } from "next";
import { Calendar, Mail, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { getSeo, getSettings } from "@/lib/data";
import { breadcrumbs, jsonLd, pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("/contact");
  return pageMeta({
    title: seo?.title ?? "Contact",
    description: seo?.description ?? "Have a system to build, secure or automate? Send a message, book a call or reach me on WhatsApp.",
    path: "/contact",
    kicker: "Contact",
  });
}

export default async function ContactPage() {
  const settings = await getSettings();
  const wa = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`;
  const channels = [
    settings.bookingUrl && { icon: Calendar, label: "Book a 30-minute call", value: "Pick a time that suits you", href: settings.bookingUrl, track: "contact_booking", external: true },
    { icon: MessageCircle, label: "WhatsApp", value: settings.whatsapp, href: wa, track: "contact_whatsapp", external: true },
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}`, track: "contact_email", external: false },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string; track: string; external: boolean }[];

  return (
    <div className="container-page pt-12 md:pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]))} />
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 text-40 md:text-48">Have a system to build, secure or automate?</h1>
          <p className="measure mt-4 text-18 text-muted">Tell me what you’re working on. I reply within one working day, usually sooner.</p>
          <ul className="mt-10 space-y-3">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noopener noreferrer" : undefined}
                  data-track={c.track}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-text">
                    <c.icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-14 font-medium">{c.label}</span>
                    <span className="block truncate text-14 text-muted">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
