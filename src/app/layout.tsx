import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BootScript } from "@/components/boot-script";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Abdul-Quddus Inda — Software engineer", template: "%s — Abdul-Quddus Inda" },
  description: "Software engineer building secure, automated systems. Web and backend development, AI automation, and network & security engineering.",
  applicationName: "inda.dev",
  authors: [{ name: "Abdul-Quddus Inda" }],
  creator: "Abdul-Quddus Inda",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
  width: "device-width",
  initialScale: 1,
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <BootScript />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
