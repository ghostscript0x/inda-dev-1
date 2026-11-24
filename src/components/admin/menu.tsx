"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WIDTH = 208;
const GAP = 4;
const EDGE = 8;

/**
 * Small accessible action menu. Rendered in a portal with fixed positioning so tables with
 * `overflow-hidden` (rounded corners) can't clip it; flips above the button when there's no room below.
 * Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move, Escape closes and returns focus, Tab closes.
 */
export function Menu({ label = "Actions", children }: { label?: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);

  // Measure after the menu renders (its height decides whether it flips up).
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const t = triggerRef.current?.getBoundingClientRect();
      const m = menuRef.current;
      if (!t || !m) return;
      const h = m.offsetHeight;
      const below = window.innerHeight - t.bottom - GAP - EDGE;
      const top = below >= h || t.top < h + GAP + EDGE ? t.bottom + GAP : t.top - h - GAP;
      const left = Math.min(Math.max(EDGE, t.right - WIDTH), window.innerWidth - WIDTH - EDGE);
      setPos({ top, left });
    };
    place();
    items()[0]?.focus();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) close();
    };
    // Scrolling the page would detach the menu from its button, so close it instead.
    const onScroll = (e: Event) => !menuRef.current?.contains(e.target as Node) && close();
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close]);

  function onMenuKey(e: React.KeyboardEvent) {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      triggerRef.current?.focus();
    } else if (e.key === "Tab") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      list[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      list[list.length - 1]?.focus();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={buttonClass({ variant: "ghost", size: "icon-sm" }, open ? "bg-surface-2 text-fg" : undefined)}
      >
        <MoreHorizontal />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: WIDTH, visibility: pos ? "visible" : "hidden" }}
            className="z-[60] overflow-hidden rounded-lg border border-border-strong bg-surface p-1 text-left shadow-xl shadow-black/30"
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  );
}

export function MenuItem({ onSelect, children, danger, href, external }: { onSelect?: () => void; children: ReactNode; danger?: boolean; href?: string; external?: boolean }) {
  const cls = cn(
    "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-14 outline-none [&_svg]:size-4 [&_svg]:shrink-0",
    danger ? "text-danger hover:bg-danger/10 focus-visible:bg-danger/10" : "text-muted hover:bg-surface-2 hover:text-fg focus-visible:bg-surface-2 focus-visible:text-fg",
  );
  if (href && external)
    return (
      <a role="menuitem" tabIndex={-1} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  if (href)
    return (
      <Link role="menuitem" tabIndex={-1} href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button role="menuitem" tabIndex={-1} type="button" onClick={onSelect} className={cls}>
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />;
}
