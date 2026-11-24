import Link from "next/link";
import { Logo } from "@/components/logo";
import { SocialIcon } from "@/components/social-icon";
import type { SiteSettings } from "@/lib/data";

const COLUMNS = [
  { title: "Site", links: [["Work", "/#work"], ["Products", "/products"], ["About", "/about"], ["Contact", "/contact"]] },
  { title: "Store", links: [["Find my downloads", "/downloads"], ["Refunds", "/refunds"], ["License", "/license"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["security.txt", "/.well-known/security.txt"]] },
] as const;

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-24 border-t border-border md:mt-32">
      <div className="container-page grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="measure mt-4 text-14 text-muted">{settings.bio}</p>
          <ul className="mt-6 flex flex-wrap gap-1" aria-label="Social links">
            {settings.socials.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target={s.network === "email" ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  data-track={`social_${s.network}`}
                  className="flex size-11 items-center justify-center rounded-md text-subtle transition-colors duration-150 hover:bg-surface-2 hover:text-accent-text"
                >
                  <SocialIcon network={s.network} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="md:col-span-2 md:col-start-auto">
            <p className="eyebrow mb-3">{col.title}</p>
            <ul className="space-y-1">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-9 items-center text-14 text-muted transition-colors duration-150 hover:text-fg" prefetch={false}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-[0.8125rem] text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Abdul-Quddus Inda. All rights reserved.</p>
          <p className="font-mono">inda.name.ng</p>
        </div>
      </div>
    </footer>
  );
}
