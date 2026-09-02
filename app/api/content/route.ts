import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const fallback = {
  hero: { kicker: 'Full stack developer', name: 'Abdul-Quddus', tagline: 'Inda.', intro: 'Full stack developer and founder of IndaTech. I work across Python, JavaScript, React, Next.js, APIs, automation, and data.' },
  about: { bio: ["I'm Abdul-Quddus Sanusy-Onuja — a full stack developer who enjoys turning a blank page into something people can actually use, from the interface to the API and database.", "Outside of client work, I'm tinkering with ideas through IndaTech: small products, AI automations, and experiments that teach me something new."], stack: 'Python · JavaScript · Next.js · React · n8n · Flask · FastAPI · PostgreSQL' },
  services: [
    { number: '01', title: 'Full Stack Web Development', text: 'Complete web applications with JavaScript, React, Next.js, Python, and dependable backend foundations.' },
    { number: '02', title: 'Backend & API Development', text: 'Secure, scalable server-side applications and integrations using Flask, FastAPI, and PostgreSQL.' },
    { number: '03', title: 'Automation & AI Workflows', text: 'n8n automations and practical AI integrations that turn repetitive work into useful infrastructure.' },
    { number: '04', title: 'Bug Fixing & Maintenance', text: 'Thoughtful troubleshooting, updates, and improvements that keep products reliable and secure.' },
  ],
  experience: [
    { period: '2024 — Present', title: 'Full Stack Developer', text: 'Building production web experiences, APIs, and automation systems across the JavaScript and Python ecosystems.' },
    { period: 'IndaTech', title: 'Founder & Builder', text: 'Exploring practical software ideas through small products, AI integrations, and tools that solve real problems.' },
  ],
  work: [
    { type: 'Featured / SaaS', title: 'Opsroom', text: 'A calm command center for teams turning noisy operations into clear decisions.', tags: ['Product Design', 'Next.js', 'AI'], accent: 'lime' },
    { type: 'Featured / Automation', title: 'Signal Stack', text: 'A lightweight intelligence layer that helps growing companies act on the information they already have.', tags: ['Strategy', 'Automation', 'Systems'], accent: 'blue' },
    { type: 'Selected / Web', title: 'Northstar', text: 'A new digital home for a modern advisory firm with a point of view.', tags: ['Direction', 'Webflow', 'Story'], accent: 'orange' },
  ],
  manifesto: 'The best technology feels less like technology and more like possibility.',
  contact: { headline: "Let's talk about your idea.", intro: 'Have a project, a question, or just want to say hello? My inbox is open. Tell me what you\'re making.' },
  profileImage: null,
}

export async function GET() {
  try {
    const profile = await prisma.profile.findFirst()
    if (!profile) return NextResponse.json(fallback)

    const [services, experience, work] = await Promise.all([
      prisma.service.findMany({ orderBy: { order: 'asc' } }),
      prisma.experience.findMany({ orderBy: { order: 'asc' } }),
      prisma.work.findMany({ orderBy: { order: 'asc' } }),
    ])

    return NextResponse.json({
      hero: { kicker: profile.kicker, name: profile.name, tagline: profile.tagline, intro: profile.intro },
      about: { bio: profile.bio, stack: profile.stack },
      services, experience, work,
      manifesto: profile.manifesto,
      contact: { headline: profile.contactHeadline, intro: profile.contactIntro },
      profileImage: profile.profileImage,
    })
  } catch {
    return NextResponse.json(fallback)
  }
}