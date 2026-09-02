import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { prisma } from '@/lib/prisma'
import './globals.css'

export const SITE_URL = 'https://www.inda.name.ng'
const LOGO_FALLBACK = '/logo.png'
const SOCIAL_IMAGE = '/avatar.png'

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  let name = 'Abdul-Quddus Inda'
  let tagline = 'Full Stack Developer'
  let intro = 'Portfolio of Abdul-Quddus Inda, a full stack developer building modern web applications, APIs, automations, and data systems.'
  let logo = LOGO_FALLBACK

  try {
    const profile = await prisma.profile.findFirst()
    if (profile) {
      name = profile.name
      tagline = profile.tagline
      intro = profile.intro || profile.tagline
      if (profile.logoImage) logo = profile.logoImage
    }
  } catch {
    // DB unavailable — fall back to static defaults
  }

  const title = `${name} — ${tagline}`
  const description = intro

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    generator: 'inda.name.ng',
    authors: [{ name, url: SITE_URL }],
    creator: name,
    alternates: {
      canonical: SITE_URL,
    },
    icons: {
      icon: [{ url: logo, type: 'image/png' }],
      apple: '/avatar.png',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: SITE_URL,
      siteName: 'inda.name.ng',
      locale: 'en_US',
      images: [
        {
          url: SOCIAL_IMAGE,
          width: 1200,
          height: 630,
          alt: `${name} — ${tagline}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SOCIAL_IMAGE],
    },
    robots: { index: true, follow: true },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
