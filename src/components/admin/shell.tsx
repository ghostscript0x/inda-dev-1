"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ChevronRight, Inbox, LayoutDashboard, LogOut, Menu, Package, Receipt, Search, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/admin/actions/auth";
import { CommandPalette, useCommandPalette } from "./command-palette";
import { NAV, currentNav, isActive } from "./nav";

function NavList({ rail, onNavigate, unread }: { rail?: boolean; onNavigate?: () => void; unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {NAV.map((g, gi) => (
        <div key={g.title ?? gi}>
          {g.title && <p className={cn("mb-1 px-2.5 text-[0.6875rem] font-medium text-subtle", rail && "hidden lg:block")}>{g.title}</p>}
          <ul className="space-y-px">
            {g.items.map((it) => {
              const active = isActive(pathname, it.href);
              const badge = it.href === "/admin/inbox" && unread > 0 ? unread : null;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={rail ? it.label : undefined}
                    className={cn(
                      "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[0.8125rem] transition-colors duration-150",
                      active ? "bg-surface-2 font-medium text-fg" : "text-muted hover:bg-surface-2/60 hover:text-fg",
                      rail && "justify-center lg:justify-start",
                    )}
                  >
                    <it.icon className={cn("size-4 shrink-0 transition-colors", active ? "text-accent-text" : "text-subtle group-hover:text-muted")} aria-hidden />
                    <span className={cn("truncate", rail && "hidden lg:inline")}>{it.label}</span>
                    {badge && (
                      <>
                        <span className={cn("ml-auto min-w-5 rounded-full bg-accent px-1.5 text-center font-mono text-[0.6875rem] leading-5 text-accent-ink", rail && "hidden lg:inline")}>{badge > 99 ? "99+" : badge}</span>
                        {rail && <span aria-hidden className="absolute top-1 right-1.5 size-1.5 rounded-full bg-accent lg:hidden" />}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SearchButton({ onClick, rail }: { onClick: () => void; rail?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={rail ? "Search (Ctrl K)" : undefined}
      className={cn(
        "flex h-8 w-full items-center gap-2.5 rounded-md border border-border bg-bg px-2.5 text-[0.8125rem] text-subtle transition-colors duration-150 hover:border-border-strong hover:text-muted",
        rail && "justify-center lg:justify-start",
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className={cn(rail && "hidden lg:inline")}>Jump to…</span>
      <kbd className={cn("ml-auto rounded border border-border px-1 font-mono text-[0.625rem]", rail && "hidden lg:inline")}>Ctrl K</kbd>
    </button>
  );
}

function Account({ email, isDemo, rail }: { email: string; isDemo: boolean; rail?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-lg px-1.5 py-1.5", rail && "flex-col lg:flex-row")}>
      <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[0.75rem] font-medium text-fg uppercase ring-1 ring-border">
        {email[0]}
      </span>
      <div className={cn("min-w-0 flex-1", rail && "hidden lg:block")}>
        <p className="truncate text-[0.8125rem] text-fg">{email}</p>
        <p className="text-[0.6875rem] text-subtle">{isDemo ? "Demo · read-only" : "Owner"}</p>
      </div>
      <form action={logoutAction}>
        <button type="submit" title="Sign out" aria-label="Sign out" className={buttonClass({ variant: "ghost", size: "icon-sm" })}>
          <LogOut />
        </button>
      </form>
    </div>
  );
}

const BOTTOM = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
];

export function AdminShell({ children, email, isDemo, unread }: { children: React.ReactNode; email: string; isDemo: boolean; unread: number }) {
  const [drawer, setDrawer] = useState(false);
  const palette = useCommandPalette();
  const pathname = usePathname();
  const here = currentNav(pathname);

  // Mark this browser as the owner's so the site's own analytics ignore it.
  useEffect(() => {
    try {
      localStorage.setItem("inda_admin", "1");
    } catch {
      /* storage blocked */
    }
  }, []);

  return (
    <div className="min-h-dvh bg-bg md:flex">
      {/* Tablet: icon rail. Desktop: full sidebar. */}
      <aside className="sticky top-0 hidden h-dvh w-[60px] shrink-0 flex-col gap-4 border-r border-border bg-surface px-2 py-3 md:flex lg:w-60 lg:px-3">
        <Link href="/admin" className="flex h-9 items-center px-1.5" aria-label="Admin overview">
          <LogoMark className="size-7 lg:hidden" />
          <Logo className="hidden h-6 w-auto lg:block" />
        </Link>
        <SearchButton rail onClick={() => palette.setOpen(true)} />
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <NavList rail unread={unread} />
        </div>
        <div className="border-t border-border pt-2">
          <Account rail email={email} isDemo={isDemo} />
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-30 flex h-13 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur-md md:px-8">
          <Dialog.Root open={drawer} onOpenChange={setDrawer}>
            <Dialog.Trigger className={buttonClass({ variant: "ghost", size: "icon-sm" }, "-ml-1.5 md:hidden")} aria-label="Open menu">
              <Menu />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 md:hidden" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col gap-4 border-r border-border bg-surface p-3 md:hidden" aria-describedby={undefined}>
                <div className="flex h-9 items-center justify-between px-1.5">
                  <Dialog.Title asChild>
                    <span>
                      <Logo className="h-6 w-auto" />
                    </span>
                  </Dialog.Title>
                  <Dialog.Close className={buttonClass({ variant: "ghost", size: "icon-sm" })} aria-label="Close menu">
                    <X />
                  </Dialog.Close>
                </div>
                <SearchButton
                  onClick={() => {
                    setDrawer(false);
                    palette.setOpen(true);
                  }}
                />
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <NavList onNavigate={() => setDrawer(false)} unread={unread} />
                </div>
                <div className="border-t border-border pt-2">
                  <Account email={email} isDemo={isDemo} />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[0.8125rem]">
            {here ? (
              <>
                <Link href={here.href} className={cn("truncate", here.sub ? "text-muted hover:text-fg" : "font-medium text-fg")}>
                  {here.label}
                </Link>
                {here.sub && (
                  <>
                    <ChevronRight className="size-3.5 shrink-0 text-subtle" aria-hidden />
                    <span className="truncate font-medium text-fg">{here.sub}</span>
                  </>
                )}
              </>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {isDemo && <span className="mr-2 hidden rounded-md bg-warning/15 px-2 py-1 text-[0.6875rem] font-medium text-warning sm:inline">Demo · read-only</span>}
            <button type="button" onClick={() => palette.setOpen(true)} className={buttonClass({ variant: "ghost", size: "icon-sm" }, "md:hidden")} aria-label="Search">
              <Search />
            </button>
            <a href="/" target="_blank" rel="noopener" className={buttonClass({ variant: "ghost", size: "sm" }, "hidden text-[0.8125rem] sm:inline-flex")}>
              View site <ArrowUpRight aria-hidden />
            </a>
            <ThemeToggle className="size-8" />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      {/* Phone: bottom bar */}
      <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {BOTTOM.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem]", active ? "text-fg" : "text-subtle")}>
              <it.icon className={cn("size-5", active && "text-accent-text")} aria-hidden />
              {it.label}
              {it.href === "/admin/inbox" && unread > 0 && <span className="absolute top-2.5 right-[calc(50%-16px)] size-2 rounded-full bg-accent" />}
            </Link>
          );
        })}
        <button type="button" onClick={() => setDrawer(true)} className="flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] text-subtle">
          <Menu className="size-5" aria-hidden />
          More
        </button>
      </nav>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-24 font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-14 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
