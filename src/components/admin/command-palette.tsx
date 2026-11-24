"use client";

import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, LogOut, Moon, Plus, Search } from "lucide-react";
import { toggleTheme } from "@/components/site/theme-toggle";
import { logoutAction } from "@/app/admin/actions/auth";
import { NAV } from "./nav";

const item =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 h-10 text-14 text-muted data-[selected=true]:bg-surface-2 data-[selected=true]:text-fg [&_svg]:size-4 [&_svg]:shrink-0";
const group = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[0.75rem] [&_[cmdk-group-heading]]:text-subtle";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed top-[14vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl shadow-black/40" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Jump to</Dialog.Title>
          <Command loop label="Admin commands">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 text-subtle" aria-hidden />
              <Command.Input placeholder="Jump to a page or run an action…" className="h-12 w-full bg-transparent text-16 text-fg outline-none placeholder:text-subtle md:text-14" />
              <kbd className="hidden rounded border border-border px-1.5 font-mono text-[0.6875rem] text-subtle sm:block">ESC</kbd>
            </div>
            <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-10 text-center text-14 text-muted">Nothing matches.</Command.Empty>
              <Command.Group heading="Actions" className={group}>
                <Command.Item value="new product create" onSelect={() => run(() => router.push("/admin/products/new"))} className={item}>
                  <Plus /> New product
                </Command.Item>
                <Command.Item value="new case study project work" onSelect={() => run(() => router.push("/admin/work/new"))} className={item}>
                  <Plus /> New case study
                </Command.Item>
                <Command.Item value="view live site open" onSelect={() => run(() => window.open("/", "_blank", "noopener"))} className={item}>
                  <ArrowUpRight /> View live site
                </Command.Item>
                <Command.Item value="toggle theme dark light mode" onSelect={() => run(toggleTheme)} className={item}>
                  <Moon /> Toggle light / dark
                </Command.Item>
              </Command.Group>
              {NAV.map((g) => (
                <Command.Group key={g.title ?? "main"} heading={g.title ?? "Go to"} className={group}>
                  {g.items.map((it) => (
                    <Command.Item key={it.href} value={`${it.label} ${it.keywords ?? ""}`} onSelect={() => run(() => router.push(it.href))} className={item}>
                      <it.icon /> {it.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
              <Command.Group heading="Account" className={group}>
                <Command.Item value="sign out log out" onSelect={() => run(() => void logoutAction())} className={item}>
                  <LogOut /> Sign out
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
