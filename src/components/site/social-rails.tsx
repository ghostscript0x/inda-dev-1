import { SocialIcon } from "@/components/social-icon";
import type { Social } from "@/lib/content";

/** Desktop-only (1280px+) fixed rails: socials on the left, email set vertically on the right. */
export function SocialRails({ socials, email }: { socials: Social[]; email: string }) {
  return (
    <>
      <div className="fixed bottom-0 left-6 z-30 hidden flex-col items-center gap-1 xl:flex 2xl:left-10">
        <ul className="flex flex-col items-center gap-1">
          {socials.map((s) => (
            <li key={s.href} className="group relative">
              <a
                href={s.href}
                target={s.network === "email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={s.label}
                data-track={`social_${s.network}`}
                className="flex size-10 items-center justify-center rounded-md text-subtle transition-colors duration-150 hover:text-accent-text"
              >
                <SocialIcon network={s.network} />
              </a>
              <span role="tooltip" className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md border border-border bg-surface px-2 py-1 font-mono text-[0.75rem] whitespace-nowrap text-fg opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
                {s.label}
              </span>
            </li>
          ))}
        </ul>
        <span aria-hidden className="mt-3 h-24 w-px bg-border-strong" />
      </div>
      <div className="fixed right-6 bottom-0 z-30 hidden flex-col items-center gap-5 xl:flex 2xl:right-10">
        <a
          href={`mailto:${email}`}
          data-track="email_click"
          className="font-mono text-[0.75rem] tracking-wider text-subtle transition-colors duration-150 [writing-mode:vertical-rl] hover:text-accent-text"
        >
          {email}
        </a>
        <span aria-hidden className="h-24 w-px bg-border-strong" />
      </div>
    </>
  );
}
