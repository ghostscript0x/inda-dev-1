import { BarChart3, BookOpen, Briefcase, Home, Inbox, LayoutDashboard, Package, Receipt, Scale, Search, Settings, Shield, Star, Tag, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; keywords?: string };
export type NavGroup = { title: string | null; items: NavItem[] };

/** Single source for the sidebar, the mobile drawer, breadcrumbs and the ⌘K palette. */
export const NAV: NavGroup[] = [
  { title: null, items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, keywords: "dashboard home today" }] },
  {
    title: "Store",
    items: [
      { href: "/admin/products", label: "Products", icon: Package, keywords: "store items files" },
      { href: "/admin/orders", label: "Orders", icon: Receipt, keywords: "sales payments refunds" },
      { href: "/admin/coupons", label: "Coupons", icon: Tag, keywords: "discounts codes" },
      { href: "/admin/reviews", label: "Reviews", icon: Star, keywords: "ratings moderation" },
    ],
  },
  {
    title: "Audience",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, keywords: "traffic visitors stats" },
      { href: "/admin/inbox", label: "Inbox", icon: Inbox, keywords: "messages contact leads" },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/content/home", label: "Homepage", icon: Home, keywords: "hero sections landing" },
      { href: "/admin/content/about", label: "About page", icon: BookOpen, keywords: "story skills timeline cv" },
      { href: "/admin/work", label: "Case studies", icon: Briefcase, keywords: "work projects portfolio" },
      { href: "/admin/people", label: "Certs & quotes", icon: Users, keywords: "certifications testimonials" },
      { href: "/admin/seo", label: "SEO", icon: Search, keywords: "meta titles descriptions" },
      { href: "/admin/legal", label: "Legal pages", icon: Scale, keywords: "privacy terms refunds license" },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/settings", label: "Site settings", icon: Settings, keywords: "name socials email whatsapp availability" },
      { href: "/admin/security", label: "Security", icon: Shield, keywords: "password 2fa sessions audit log" },
    ],
  },
];

const ALL = NAV.flatMap((g) => g.items.map((it) => ({ ...it, group: g.title })));

export function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** The nav entry a path belongs to (longest match), for the top-bar breadcrumb. */
export function currentNav(pathname: string) {
  if (pathname.startsWith("/admin/audit")) return { ...ALL.find((i) => i.href === "/admin/security")!, sub: "Audit log" };
  const match = ALL.filter((i) => isActive(pathname, i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  if (!match) return null;
  const rest = pathname.slice(match.href.length).split("/").filter(Boolean);
  const sub = rest.length ? (rest[0] === "new" ? "New" : "Edit") : null;
  return { ...match, sub };
}
