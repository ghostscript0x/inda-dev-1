'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight, Check, ChevronRight, Eye, EyeOff, LogOut, Menu, Plus, Trash2, X,
} from 'lucide-react'
import { ProfileView } from '@/components/admin/profile-view'
import { ListEditor } from '@/components/admin/list-editor'
import { TimelineEditor } from '@/components/admin/timeline-editor'
import { WorkEditor } from '@/components/admin/work-editor'

interface Profile {
  id: string
  name: string
  tagline: string
  kicker: string
  intro: string
  bio: string[]
  stack: string
  manifesto: string
  contactHeadline: string
  contactIntro: string
  profileImage: string | null
}

interface Service { id: string; number: string; title: string; text: string; order: number }
interface Experience { id: string; period: string; title: string; text: string; order: number }
interface Work { id: string; type: string; title: string; text: string; tags: string[]; accent: string; image: string | null; link: string | null; order: number }

type Tab = 'profile' | 'services' | 'experience' | 'work'

const NAV: { key: Tab; label: string; hint: string }[] = [
  { key: 'profile', label: 'Profile', hint: 'Hero, bio & identity' },
  { key: 'services', label: 'Services', hint: 'What you build' },
  { key: 'experience', label: 'Experience', hint: 'Your journey' },
  { key: 'work', label: 'Work', hint: 'Featured projects' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [experience, setExperience] = useState<Experience[]>([])
  const [work, setWork] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'services' | 'experience' | 'work'; id: string } | null>(null)

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))
    if (!token) { router.push('/admin'); return }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const notify = (msg: string) => setToast(msg)

  const loadData = async () => {
    try {
      const [p, s, e, w] = await Promise.all([
        fetch('/api/admin/profile').then(r => r.json()),
        fetch('/api/admin/services').then(r => r.json()),
        fetch('/api/admin/experience').then(r => r.json()),
        fetch('/api/admin/work').then(r => r.json()),
      ])
      setProfile(p); setServices(s); setExperience(e); setWork(w)
    } catch {
      notify('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const api = {
    profile: {
      save: async () => {
        setSaving(true)
        await fetch('/api/admin/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
        setSaving(false); notify('Profile saved')
      },
      upload: async (file: File) => {
        const fd = new FormData(); fd.append('file', file); fd.append('folder', 'portfolio/profile')
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const data = await res.json()
        setProfile(p => p ? { ...p, profileImage: data.url } : p)
        notify('Image uploaded')
      },
    },
    services: {
      save: async (s: Service) => {
        await fetch('/api/admin/services', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
        setServices(services.map(x => x.id === s.id ? s : x)); notify('Saved')
      },
      add: async () => {
        const res = await fetch('/api/admin/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number: String(services.length + 1).padStart(2, '0'), title: 'New Service', text: 'Description', order: services.length }) })
        const created = await res.json(); setServices([...services, created])
      },
      del: async (id: string) => {
        await fetch('/api/admin/services', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        setServices(services.filter(s => s.id !== id)); notify('Deleted')
      },
    },
    experience: {
      save: async (x: Experience) => {
        await fetch('/api/admin/experience', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x) })
        setExperience(experience.map(i => i.id === x.id ? x : i)); notify('Saved')
      },
      add: async () => {
        const res = await fetch('/api/admin/experience', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period: '2024 — Present', title: 'New Position', text: 'Description', order: experience.length }) })
        const created = await res.json(); setExperience([...experience, created])
      },
      del: async (id: string) => {
        await fetch('/api/admin/experience', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        setExperience(experience.filter(i => i.id !== id)); notify('Deleted')
      },
    },
    work: {
      save: async (w: Work) => {
        await fetch('/api/admin/work', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(w) })
        setWork(work.map(i => i.id === w.id ? w : i)); notify('Saved')
      },
      add: async () => {
        const res = await fetch('/api/admin/work', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'Featured / Web', title: 'New Project', text: 'Description', tags: ['Tag'], accent: 'lime', order: work.length }) })
        const created = await res.json(); setWork([...work, created])
      },
      del: async (id: string) => {
        await fetch('/api/admin/work', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        setWork(work.filter(i => i.id !== id)); notify('Deleted')
      },
    },
  }

  const logout = () => { document.cookie = 'token=; path=/; max-age=0'; router.push('/admin') }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--muted)' }}>
          <span className="w-4 h-4 rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--green)', animation: 'spin 0.7s linear infinite' }} />
          Loading dashboard…
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      </div>
    )
  }

  const current = NAV.find(n => n.key === tab)!

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 text-sm font-medium animate-toast" style={{ background: 'var(--panel)', border: '1px solid var(--green)', color: 'var(--foreground)', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
          <Check size={16} style={{ color: 'var(--green)' }} /> {toast}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 lg:hidden" style={{ background: 'rgba(0,0,0,.5)' }} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 h-screen w-64 flex flex-col shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`} style={{ background: 'var(--panel)', borderRight: '1px solid var(--line)' }}>
        <div className="flex items-center gap-3 px-6 h-20 border-b" style={{ borderColor: 'var(--line)' }}>
          <span className="w-9 h-9 grid place-items-center text-sm font-black" style={{ background: 'var(--green)', color: 'var(--background)', borderRadius: 8 }}>A</span>
          <div>
            <p className="text-sm font-bold leading-none">inda.dev</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>Content Studio</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: 'var(--muted)' }}><X size={18} /></button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(n => {
            const active = tab === n.key
            return (
              <button
                key={n.key}
                onClick={() => { setTab(n.key); setSidebarOpen(false) }}
                className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm transition-all text-left"
                style={{
                  background: active ? 'var(--green)' : 'transparent',
                  color: active ? 'var(--background)' : 'var(--muted)',
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span className="capitalize w-5">{n.key.charAt(0)}</span>
                <span className="flex-1 capitalize">{n.label}</span>
                {active && <ChevronRight size={15} />}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--line)' }}>
          <a href="/" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm mb-2 transition-colors" style={{ color: 'var(--muted)' }}>
            View site <ArrowUpRight size={15} />
          </a>
          <button onClick={logout} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors" style={{ color: 'var(--muted)' }}>
            Sign out <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-20 flex items-center justify-between px-5 md:px-8 border-b" style={{ background: 'rgba(9,10,10,.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)} style={{ color: 'var(--foreground)' }}><Menu size={20} /></button>
            <div>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--green)' }}>{current.hint}</p>
              <h1 className="text-lg font-semibold leading-tight">{current.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push('/')} className="hidden md:flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg transition-colors" style={{ border: '1px solid var(--line)', color: 'var(--muted)' }}>
              View site <ArrowUpRight size={14} />
            </button>
            <button onClick={logout} className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg font-medium transition-colors" style={{ background: 'var(--green)', color: 'var(--background)' }}>
              <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 md:px-8 py-8">
          {tab === 'profile' && profile && <ProfileView profile={profile} setProfile={setProfile} onSave={api.profile.save} onUpload={api.profile.upload} saving={saving} />}
          {tab === 'services' && <ListEditor items={services} setItems={setServices} kind="services" onSave={api.services.save} onAdd={api.services.add} onDelete={api.services.del} setConfirm={setConfirmDelete} />}
          {tab === 'experience' && <TimelineEditor items={experience} setItems={setExperience} onSave={api.experience.save} onAdd={api.experience.add} onDelete={api.experience.del} setConfirm={setConfirmDelete} />}
          {tab === 'work' && <WorkEditor items={work} setItems={setWork} onSave={api.work.save} onAdd={api.work.add} onDelete={api.work.del} setConfirm={setConfirmDelete} />}
        </main>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,.6)' }} onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm p-6 rounded-xl" style={{ background: 'var(--panel)', border: '1px solid var(--line)', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            <h3 className="text-lg font-semibold mb-2">Delete this item?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>This can&apos;t be undone. Removing it will hide it from your live portfolio.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid var(--line)', color: 'var(--foreground)' }}>Cancel</button>
              <button onClick={() => { api[confirmDelete.type].del(confirmDelete.id); setConfirmDelete(null) }} className="flex-1 py-2.5 rounded-lg text-sm font-bold" style={{ background: '#ff4757', color: '#fff' }}>
                <span className="inline-flex items-center gap-1.5"><Trash2 size={14} /> Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
