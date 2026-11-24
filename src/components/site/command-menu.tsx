"use client";

import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowUpRight, FileText, Moon, Package, Search, Sun } from "lucide-react";
import { setTheme } from "./theme-toggle";
import { track } from "./track";

export type SearchIndex = {
  projects: { title: string; href: string; hint: string }[];
  products: { title: string; href: string; hint: string }[];
};

const PAGES = [
  { title: "Home", href: "/" },
  { title: "Work", href: "/#work" },
  { title: "Products", href: "/products" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
  { title: "Find my downloads", href: "/downloads" },
];

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-14 text-muted data-[selected=true]:bg-surface-2 data-[selected=true]:text-fg [&_svg]:size-4 [&_svg]:shrink-0";
const groupClass = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[0.75rem] [&_[cmdk-group-heading]]:text-subtle";

export default function CommandMenu({ open, onOpenChange, index }: { open: boolean; onOpenChange: (o: boolean) => void; index: SearchIndex }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const queryRef = useRef("");

  function close() {
    const q = queryRef.current.trim();
    if (q.length > 1) track("search", { q: q.slice(0, 80) });
    queryRef.current = "";
    setQuery("");
    onOpenChange(false);
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  function pickTheme(t: "light" | "dark") {
    setTheme(t);
    close();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl shadow-black/40"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Command loop label="Search the site">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 text-subtle" aria-hidden />
              <Command.Input
                value={query}
                onValueChange={(v) => {
                  queryRef.current = v;
                  setQuery(v);
                }}
                placeholder="Search pages, projects, products…"
                className="h-13 w-full bg-transparent text-16 text-fg outline-none placeholder:text-subtle"
              />
              <kbd className="hidden rounded border border-border px-1.5 font-mono text-[0.6875rem] text-subtle sm:block">ESC</kbd>
            </div>
            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-14 text-muted">No results for &ldquo;{query}&rdquo;.</Command.Empty>
              <Command.Group heading="Pages" className={groupClass}>
                {PAGES.map((p) => (
                  <Command.Item key={p.href} value={`page ${p.title}`} onSelect={() => go(p.href)} className={itemClass}>
                    <FileText /> {p.title}
                  </Command.Item>
                ))}
              </Command.Group>
              {index.projects.length > 0 && (
                <Command.Group heading="Work" className={groupClass}>
                  {index.projects.map((p) => (
                    <Command.Item key={p.href} value={`work ${p.title} ${p.hint}`} onSelect={() => go(p.href)} className={itemClass}>
                      <ArrowUpRight />
                      <span className="truncate">{p.title}</span>
                      <span className="ml-auto hidden max-w-[45%] truncate text-[0.8125rem] text-subtle sm:block">{p.hint}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {index.products.length > 0 && (
                <Command.Group heading="Products" className={groupClass}>
                  {index.products.map((p) => (
                    <Command.Item key={p.href} value={`product ${p.title} ${p.hint}`} onSelect={() => go(p.href)} className={itemClass}>
                      <Package />
                      <span className="truncate">{p.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              <Command.Group heading="Theme" className={groupClass}>
                <Command.Item value="theme dark mode" onSelect={() => pickTheme("dark")} className={itemClass}>
                  <Moon /> Dark theme
                </Command.Item>
                <Command.Item value="theme light mode" onSelect={() => pickTheme("light")} className={itemClass}>
                  <Sun /> Light theme
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
