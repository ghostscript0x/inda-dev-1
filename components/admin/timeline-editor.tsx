import { Plus, Trash2, Briefcase, Save } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { Field, Input, Textarea, AddButton, Btn } from '@/components/admin/ui'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toMonthVal(s: string): string {
  const m = /(\d{4})-(\d{2})/.exec(s)
  if (m) return `${m[1]}-${m[2]}`
  const mn = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i.exec(s)
  if (mn) return `${mn[2]}-${String(MONTHS.indexOf(mn[1].charAt(0).toUpperCase() + mn[1].slice(1).toLowerCase()) + 1).padStart(2, '0')}`
  const y = /(19|20)\d{2}/.exec(s)
  if (y) return `${y[0]}-01`
  return ''
}

function fmtMonthVal(v: string): string {
  if (!v) return ''
  const [y, m] = v.split('-')
  if (m && m !== '00' && +m >= 1 && +m <= 12) return `${MONTHS[+m - 1]} ${y}`
  return y
}

function splitPeriod(period: string): { start: string; end: string; present: boolean } {
  const parts = period.split(/\s*[—–-]\s*/).map(p => p.trim()).filter(Boolean)
  const start = toMonthVal(parts[0] || '')
  const end = parts.length > 1 ? toMonthVal(parts[1]) : ''
  const present = parts.length > 1 && /present|now|current/i.test(parts[parts.length - 1])
  return { start, end: present ? '' : end, present }
}

function buildPeriod(start: string, end: string, present: boolean): string {
  const s = fmtMonthVal(start)
  if (!s) return present ? '' : ''
  if (present) return `${s} — Present`
  return end ? `${s} — ${fmtMonthVal(end) || 'Present'}` : s
}

function fmtPeriod(period: string): string {
  const parts = period.split(/\s*[—–-]\s*/).map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return '—'
  return parts.map(p => fmtMonthVal(toMonthVal(p)) || p).join(' — ')
}

function PeriodFields({ period, onChange }: { period: string; onChange: (period: string) => void }) {
  const { start, end, present } = splitPeriod(period)
  const update = (patch: { start?: string; end?: string; present?: boolean }) =>
    onChange(buildPeriod(patch.start ?? start, patch.end ?? end, patch.present ?? present))

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Field label="Start" hint="When the role began">
        <input type="month" value={start} onChange={e => update({ start: e.target.value })} className="w-full" style={{ padding: '9px 12px', fontSize: 14, color: 'var(--foreground)', background: 'var(--background)', border: '1px solid var(--line)', borderRadius: 10, outline: 'none' }} />
      </Field>
      <Field label="End" hint={present ? 'Currently active' : 'Or tick Present for a current role'}>
        <div className="flex items-center gap-3">
          <input type="month" value={end} disabled={present} onChange={e => update({ end: e.target.value })} className="w-full" style={{ padding: '9px 12px', fontSize: 14, color: 'var(--foreground)', background: 'var(--background)', border: '1px solid var(--line)', borderRadius: 10, outline: 'none', opacity: present ? 0.4 : 1 }} />
          <label className="flex items-center gap-2 text-xs whitespace-nowrap cursor-pointer select-none" style={{ color: 'var(--muted)' }}>
            <input type="checkbox" checked={present} onChange={e => update({ present: e.target.checked })} style={{ accentColor: 'var(--green)', width: 15, height: 15 }} />
            Present
          </label>
        </div>
      </Field>
    </div>
  )
}

export function TimelineEditor({ items, setItems, onSave, onAdd, onDelete, setConfirm }: {
  items: any[]
  setItems: Dispatch<SetStateAction<any[]>>
  onSave: (i: any) => void
  onAdd: () => void
  onDelete: (id: string) => void
  setConfirm: (c: { type: any; id: string } | null) => void
}) {
  const patch = (id: string, data: Record<string, unknown>) => setItems(items.map(i => (i as any).id === id ? { ...i, ...data } : i))

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase size={17} style={{ color: 'var(--green)' }} /> Experience
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Your professional journey, newest on top</p>
        </div>
        <AddButton onClick={onAdd} />
      </div>

      {items.length === 0 && (
        <div className="rounded-xl py-16 text-center" style={{ border: '1px dashed var(--line)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No experience yet. Add your first role.</p>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-[118px] top-2 bottom-2 w-px" style={{ background: 'linear-gradient(var(--line), rgba(255,255,255,0))' }} />

        <div className="flex flex-col gap-6">
          {items.map((item, idx) => (
            <div key={(item as any).id} className="relative flex gap-6">
              <div className="w-[106px] shrink-0 pt-1 text-right">
                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono tracking-tight max-w-full truncate" style={{ background: 'rgba(16,240,160,.08)', color: 'var(--green)', border: '1px solid rgba(16,240,160,.25)' }}>
                  {fmtPeriod((item as any).period || '')}
                </span>
              </div>

              <div className="absolute left-[112px] top-1.5 w-3 h-3 rounded-full" style={{ background: 'var(--background)', border: '2px solid var(--green)', boxShadow: '0 0 0 3px rgba(16,240,160,.18)' }} />

              <section className="rounded-xl flex-1 overflow-hidden" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--green)' }}>#{String(idx + 1).padStart(2, '0')}</span>
                    <span className="uppercase tracking-wider">Role</span>
                  </div>
                  <button onClick={() => setConfirm({ type: 'experience', id: (item as any).id })} className="p-1.5 rounded-md transition-colors hover:bg-red-500/10" style={{ color: 'var(--muted)' }} aria-label="Delete role">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="p-5 grid gap-5">
                  <Field label="Title"><Input value={(item as any).title} onChange={e => patch((item as any).id, { title: e.target.value })} placeholder="Senior Developer" /></Field>
                  <PeriodFields period={(item as any).period || ''} onChange={p => patch((item as any).id, { period: p })} />
                  <Field label="Description"><Textarea rows={3} value={(item as any).text} onChange={e => patch((item as any).id, { text: e.target.value })} /></Field>
                </div>
                <div className="flex justify-end gap-2 px-5 pb-5">
                  <Btn variant="ghost" onClick={() => setConfirm({ type: 'experience', id: (item as any).id })}>Delete</Btn>
                  <Btn onClick={() => onSave(item)}><Save size={14} /> Save</Btn>
                </div>
              </section>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <Btn variant="ghost" onClick={onAdd}><Plus size={15} /> Add another role</Btn>
      </div>
    </div>
  )
}
