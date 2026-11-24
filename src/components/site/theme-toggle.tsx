"use client";

import { Moon, Sun } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export function setTheme(next: "light" | "dark") {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* storage blocked: theme still applies for this page view */
  }
}

export function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
}

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button type="button" onClick={toggleTheme} className={buttonClass({ variant: "ghost", size: "icon" }, className)} aria-label="Toggle theme" data-track="theme_toggle">
      <Sun className="hidden light:block" />
      <Moon className="block light:hidden" />
    </button>
  );
}
