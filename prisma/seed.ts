import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from '../lib/auth'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create admin user
  const adminPassword = await hashPassword('admin123')
  await prisma.admin.upsert({
    where: { email: 'admin@inda.dev' },
    update: {},
    create: {
      email: 'admin@inda.dev',
      password: adminPassword,
      name: 'Admin',
    },
  })
  console.log('Admin user created')

  // Create profile
  await prisma.profile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Abdul-Quddus',
      tagline: 'Inda.',
      kicker: 'Full stack developer',
      intro: 'Full stack developer and founder of IndaTech. I work across Python, JavaScript, React, Next.js, APIs, automation, and data.',
      bio: [
        "I'm Abdul-Quddus Sanusy-Onuja — a full stack developer who enjoys turning a blank page into something people can actually use, from the interface to the API and database.",
        "Outside of client work, I'm tinkering with ideas through IndaTech: small products, AI automations, and experiments that teach me something new.",
      ],
      stack: 'Python · JavaScript · Next.js · React · n8n · Flask · FastAPI · PostgreSQL',
      manifesto: 'The best technology feels less like technology and more like possibility.',
      contactHeadline: "Let's talk about your idea.",
      contactIntro: 'Have a project, a question, or just want to say hello? My inbox is open. Tell me what you\'re making.',
    },
  })
  console.log('Profile created')

  // Create services
  const services = [
    { number: '01', title: 'Full Stack Web Development', text: 'Complete web applications with JavaScript, React, Next.js, Python, and dependable backend foundations.', order: 0 },
    { number: '02', title: 'Backend & API Development', text: 'Secure, scalable server-side applications and integrations using Flask, FastAPI, and PostgreSQL.', order: 1 },
    { number: '03', title: 'Automation & AI Workflows', text: 'n8n automations and practical AI integrations that turn repetitive work into useful infrastructure.', order: 2 },
    { number: '04', title: 'Bug Fixing & Maintenance', text: 'Thoughtful troubleshooting, updates, and improvements that keep products reliable and secure.', order: 3 },
  ]

  for (const service of services) {
    await prisma.service.create({ data: service })
  }
  console.log('Services created')

  // Create experience
  const experience = [
    { period: '2024 — Present', title: 'Full Stack Developer', text: 'Building production web experiences, APIs, and automation systems across the JavaScript and Python ecosystems.', order: 0 },
    { period: 'IndaTech', title: 'Founder & Builder', text: 'Exploring practical software ideas through small products, AI integrations, and tools that solve real problems.', order: 1 },
  ]

  for (const exp of experience) {
    await prisma.experience.create({ data: exp })
  }
  console.log('Experience created')

  // Create work
  const work = [
    { type: 'Featured / SaaS', title: 'Opsroom', text: 'A calm command center for teams turning noisy operations into clear decisions.', tags: ['Product Design', 'Next.js', 'AI'], accent: 'lime', order: 0 },
    { type: 'Featured / Automation', title: 'Signal Stack', text: 'A lightweight intelligence layer that helps growing companies act on the information they already have.', tags: ['Strategy', 'Automation', 'Systems'], accent: 'blue', order: 1 },
    { type: 'Selected / Web', title: 'Northstar', text: 'A new digital home for a modern advisory firm with a point of view.', tags: ['Direction', 'Webflow', 'Story'], accent: 'orange', order: 2 },
  ]

  for (const item of work) {
    await prisma.work.create({ data: item })
  }
  console.log('Work created')

  console.log('Database seeded!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
