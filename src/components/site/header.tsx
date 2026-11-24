"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Logo } from "@/components/logo";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { SocialIcon } from "@/components/social-icon";
import { cn } from "@/lib/utils";
import type { Social } from "@/lib/content";
import { ThemeToggle } from "./theme-toggle";
import type { SearchIndex } from "./command-menu";

// The command menu (and cmdk) loads only when first opened.
const CommandMenu = dynamic(() => import("./command-menu"), { ssr: false });

const NAV = [
  { href: "/#work", label: "Work", match: "/work" },
  { href: "/products", label: "Products", match: "/products" },
  { href: "/about", label: "About", match: "/about" },
];

export function Header({ index, socials }: { index: SearchIndex; socials: Social[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchLoaded(true);
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openSearch = () => {
    setSearchLoaded(true);
    setSearchOpen(true);
  };

  return (
    <>
      <a href="#main" className="sr-only z-[60] rounded-md bg-accent px-3 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <header className={cn("sticky top-0 z-40 border-b transition-colors duration-200", scrolled ? "border-border bg-bg/85 backdrop-blur-md" : "border-transparent bg-transparent")}>
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="-m-1 rounded-md p-1" aria-label="inda.dev home">
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative rounded-md px-3 py-2 text-14 transition-colors duration-150", active ? "text-fg" : "text-muted hover:text-fg")}
                >
                  {item.label}
                  {active && <span aria-hidden className="absolute -bottom-[13px] left-1/2 h-3 w-px -translate-x-1/2 rotate-[35deg] bg-accent" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openSearch}
              className={cn(buttonClass({ variant: "ghost", size: "sm" }), "hidden h-9 gap-2 px-2.5 sm:inline-flex")}
              aria-label="Search (Ctrl K)"
              aria-keyshortcuts="Control+K Meta+K"
            >
              <Search />
              <kbd className="font-mono text-[0.6875rem] text-subtle">⌘K</kbd>
            </button>
            <button type="button" onClick={openSearch} className={buttonClass({ variant: "ghost", size: "icon" }, "size-11 sm:hidden")} aria-label="Search">
              <Search />
            </button>
            <ThemeToggle className="max-sm:size-11" />
            <ButtonLink href="/contact" size="sm" className="ml-2 hidden md:inline-flex" data-track="cta_contact_header">
              Contact
            </ButtonLink>
            <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Dialog.Trigger className={buttonClass({ variant: "ghost", size: "icon" }, "size-11 md:hidden")} aria-label="Open menu">
                <Menu />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Content className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg" aria-describedby={undefined}>
                  <Dialog.Title className="sr-only">Menu</Dialog.Title>
                  <div className="container-page flex h-16 shrink-0 items-center justify-between">
                    <Logo />
                    <Dialog.Close className={buttonClass({ variant: "ghost", size: "icon" }, "size-11")} aria-label="Close menu">
                      <X />
                    </Dialog.Close>
                  </div>
                  <nav aria-label="Mobile" className="container-page mt-6 flex flex-col">
                    {[...NAV, { href: "/contact", label: "Contact", match: "/contact" }].map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex min-h-14 items-center border-b border-border text-24 font-medium tracking-tight">
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="container-page mt-auto flex flex-wrap gap-2 pt-10 pb-10">
                    {socials.map((s) => (
                      <a
                        key={s.href}
                        href={s.href}
                        target={s.network === "email" ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className={buttonClass({ variant: "outline", size: "icon" }, "size-12")}
                        data-track={`social_${s.network}`}
                      >
                        <SocialIcon network={s.network} />
                      </a>
                    ))}
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </header>
      {searchLoaded && <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} index={index} />}
    </>
  );
}
