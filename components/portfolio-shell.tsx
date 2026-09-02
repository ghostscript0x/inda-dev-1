'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'

interface Content {
  hero: { kicker: string; name: string; tagline: string; intro: string }
  about: { bio: string[]; stack: string }
  services: { number: string; title: string; text: string }[]
  experience: { period: string; title: string; text: string }[]
  work: { type: string; title: string; text: string; tags: string[]; accent: string; link?: string | null }[]
  manifesto: string
  contact: { headline: string; intro: string }
  profileImage: string | null
}

const fallback: Content = {
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
    { type: 'Featured / SaaS', title: 'Opsroom', text: 'A calm command center for teams turning noisy operations into clear decisions.', tags: ['Product Design', 'Next.js', 'AI'], accent: 'lime', link: 'https://github.com' },
    { type: 'Featured / Automation', title: 'Signal Stack', text: 'A lightweight intelligence layer that helps growing companies act on the information they already have.', tags: ['Strategy', 'Automation', 'Systems'], accent: 'blue', link: 'https://github.com' },
    { type: 'Selected / Web', title: 'Northstar', text: 'A new digital home for a modern advisory firm with a point of view.', tags: ['Direction', 'Webflow', 'Story'], accent: 'orange', link: 'https://github.com' },
  ],
  manifesto: 'The best technology feels less like technology and more like possibility.',
  contact: { headline: "Let's talk about your idea.", intro: 'Have a project, a question, or just want to say hello? My inbox is open. Tell me what you\'re making.' },
  profileImage: null,
}

export function PortfolioShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [content, setContent] = useState<Content | null>(null)

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setContent)
      .catch(() => setContent(fallback))
  }, [])

  const closeMenu = () => setMenuOpen(false)

  if (!content) return null

  const manifestoQuote = `\u201C${content.manifesto}\u201D`

  return (
    <div className="site-shell">
      <header className="site-header">
        <a href="#top" className="wordmark" onClick={closeMenu} aria-label="inda.name.ng home">
          <span className="wordmark-mark"><img src="/logo.png" alt="" /></span><span>inda<span className="accent-text">.name.ng</span></span>
        </a>
        <nav className={`site-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#work" onClick={closeMenu}>Work</a>
          <a href="#about" onClick={closeMenu}>About me</a>
          <a href="#services" onClick={closeMenu}>What I build</a>
          <a href="#contact" onClick={closeMenu}>Say hello</a>
        </nav>
        <a href="#contact" className="header-cta" onClick={closeMenu}>Say hello <ArrowUpRight aria-hidden="true" /></a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-kicker"><span className="signal-dot" /> {content.hero.kicker} <span className="kicker-rule" /></div>
          <h1>Hi, I&apos;m<br /><span>{content.hero.name}</span><br />{content.hero.tagline}</h1>
          <div className="hero-bottom">
            <p className="hero-intro">{content.hero.intro}</p>
            <a className="text-link" href="#work">Browse my work <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <div className="hero-visual"><div className="visual-grid" /><div className="visual-corner tl" /><div className="visual-corner br" /><div className="visual-coord tl">41°24·N 2°10·E</div><div className="visual-coord br">v2.6 / 2026</div><div className="visual-mark"><img src="/logo.png" alt="inda.name.ng logo mark" /></div><div className="visual-id"><span className="visual-name">inda.name.ng</span><span className="visual-role">Design · Build · Launch</span></div><div className={`profile-slot ${content.profileImage ? 'has-photo' : ''}`} aria-label="Profile photo"><div className="pf-inner"><div className="pf-ring" />{content.profileImage ? <img src={content.profileImage} alt="Profile photo" /> : <div className="pf-mono"><span>AQ</span><small>Profile<br />coming soon</small></div>}<span className="pf-pulse" /></div><span className="pf-corner">inda</span></div><div className="visual-caption">Designing with intent.<br />Building with momentum.</div><div className="visual-stack"><span>REACT</span><span>NEXT.JS</span><span>TAILWIND</span><span>NODE</span></div></div>
        </section>

        <section id="about" className="about section-pad section-border">
          <div className="section-index">( 001 )</div><div className="section-heading"><p className="eyebrow">About me</p><h2>Developer.<br /><em>Curious human.</em></h2></div>
          <div className="about-copy">{content.about.bio.map((p, i) => <p key={i}>{p}</p>)}<p className="stack-line"><strong>Stack:</strong> {content.about.stack}</p><a href="#contact" className="text-link">Want to build together <ArrowUpRight aria-hidden="true" /></a></div>
        </section>

        <section id="services" className="services section-pad section-border"><div className="section-index">( 002 )</div><div className="section-heading"><p className="eyebrow">What I like building</p><h2>Work that<br /><em>feels good.</em></h2></div><div className="service-list">{content.services.map((service) => <article className="service-item" key={service.number}><span className="service-number">{service.number}</span><div><h3>{service.title}</h3><p>{service.text}</p></div><ArrowUpRight className="service-arrow" aria-hidden="true" /></article>)}</div></section>

        <section id="experience" className="experience section-pad section-border"><div className="section-index">( 003 )</div><div className="section-heading"><p className="eyebrow">Experience</p><h2>Where I&apos;ve<br /><em>been building.</em></h2></div><div className="experience-list">{content.experience.map((exp, i) => <article key={i}><span>{exp.period}</span><div><h3>{exp.title}</h3><p>{exp.text}</p></div></article>)}</div></section>

        <section id="work" className="work section-pad section-border"><div className="section-index">( 004 )</div><div className="section-heading"><p className="eyebrow">Things I&apos;ve made</p><h2>A few<br /><em>favorites.</em></h2></div><div className="work-grid">{content.work.map((item) => <a className={`work-card ${item.accent}`} key={item.title} href={item.link || '#contact'} target={item.link ? '_blank' : undefined} rel={item.link ? 'noopener noreferrer' : undefined}><div className="work-art"><div className="art-lines" /><span className="art-code">{item.type}</span><span className="art-title">{item.title}</span><div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><span className="art-view">View project <ArrowUpRight size={15} /></span></div><div className="work-meta"><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpRight className="work-arrow" aria-hidden="true" /></div></a>)}</div></section>

        <section className="manifesto section-pad"><p className="eyebrow">A working philosophy</p><blockquote>{manifestoQuote}</blockquote><div className="manifesto-sign">— inda.name.ng / <span>Independent by design</span></div></section>

        <section id="contact" className="contact section-pad section-border"><div className="section-index">( 005 )</div><div className="contact-content"><p className="eyebrow">Open to good conversations</p><h2>{content.contact.headline}</h2><p className="contact-intro">{content.contact.intro}</p><form onSubmit={(event) => { const fd = new FormData(event.currentTarget); const name = (fd.get('name') || '').toString(); const email = (fd.get('email') || '').toString(); const message = (fd.get('message') || '').toString(); const subject = encodeURIComponent(`New inquiry from ${name}`); const body = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${message}`); event.preventDefault(); window.location.href = `mailto:hello@inda.name.ng?subject=${subject}&body=${body}` }} className="contact-form"><label>Name<input required name="name" placeholder="Your name" /></label><label>Email<input required type="email" name="email" placeholder="you@company.com" /></label><label>What are we making?<textarea required name="message" rows={3} placeholder="A few words about the project..." /></label><button type="submit" className="submit-button">Send inquiry <ArrowUpRight aria-hidden="true" /></button></form></div></section>
      </main>
      <footer className="site-footer"><div className="footer-brand"><span className="wordmark-mark"><img src="/logo.png" alt="" /></span><p>inda.name.ng<br /><span>Innovate. Automate. Elevate.</span></p></div><div className="footer-links"><a href="mailto:hello@inda.name.ng">hello@inda.name.ng</a><a href="https://wa.me/2348055240581">WhatsApp ↗</a><a href="https://www.inda.name.ng">Portfolio ↗</a></div><p className="footer-note">© 2026 inda.name.ng<br />Built with intent.</p></footer>
    </div>
  )
}
