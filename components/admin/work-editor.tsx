import { Plus, Trash2, Save, FolderKanban, X, Link2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { Field, Input, Textarea, AddButton, Btn } from '@/components/admin/ui'

const ACCENTS = [
  { key: 'lime', label: 'Lime', color: '#849e30' },
  { key: 'blue', label: 'Blue', color: '#245e70' },
  { key: 'orange', label: 'Orange', color: '#a56b39' },
]

function AccentPicker({ value, onChange }: { value: string; onChange: (a: string) => void }) {
  return (
    <div className="flex gap-3">
      {ACCENTS.map(a => {
        const active = (value || 'lime') === a.key
        return (
          <button key={a.key} type="button" onClick={() => onChange(a.key)} className="flex flex-col items-center gap-1.5 rounded-lg transition-all"
            style={{ border: `1px solid ${active ? a.color : 'var(--line)'}`, background: active ? a.color : 'transparent', boxShadow: active ? `0 0 0 3px ${a.color}33` : 'none' }}
            aria-pressed={active}>
            <span className="h-8 w-14 rounded" style={{ background: a.color }} />
            <span className="text-[10px] px-2 pb-1" style={{ color: active ? '#fff' : 'var(--muted)' }}>{a.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const add = (raw: string) => {
    const vals = raw.split(',').map(t => t.trim()).filter(Boolean)
    if (vals.length) onChange([...new Set([...tags, ...vals])])
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2.5">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] uppercase tracking-wide" style={{ background: 'rgba(16,240,160,.08)', color: 'var(--green)', border: '1px solid rgba(16,240,160,.22)' }}>
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} aria-label={`Remove ${t}`} className="hover:opacity-70"><X size={11} /></button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-[11px]" style={{ color: 'var(--muted)' }}>No tags yet</span>}
      </div>
      <Input placeholder="Type a tag and press Enter…" onKeyDown={e => { if (e.key === 'Enter') { add((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '' } }} onBlur={e => { if (e.target.value.trim()) { add(e.target.value); e.target.value = '' } }} />
    </div>
  )
}

export function WorkEditor({ items, setItems, onSave, onAdd, onDelete, setConfirm }: {
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
            <FolderKanban size={17} style={{ color: 'var(--green)' }} /> Work
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Featured projects on the homepage</p>
        </div>
        <AddButton onClick={onAdd} />
      </div>

      {items.length === 0 && (
        <div className="rounded-xl py-16 text-center" style={{ border: '1px dashed var(--line)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No projects yet. Add your first one.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {items.map((item, idx) => (
          <section key={(item as any).id} className="rounded-xl overflow-hidden" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
            <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
              <span className="flex h-2.5 w-2.5 rounded-full" style={{ background: (ACCENTS.find(a => a.key === (item as any).accent) || ACCENTS[0]).color }} />
              <span className="text-xs font-medium truncate">{(item as any).title || 'Untitled'}</span>
              <span className="text-[10px] uppercase tracking-wider ml-auto" style={{ color: 'var(--muted)' }}>#{(item as any).order + 1}</span>
              <button onClick={() => setConfirm({ type: 'work', id: (item as any).id })} className="p-1.5 rounded-md transition-colors hover:bg-red-500/10" style={{ color: 'var(--muted)' }} aria-label="Delete project"><Trash2 size={15} /></button>
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-5">
              <Field label="Title"><Input value={(item as any).title} onChange={e => patch((item as any).id, { title: e.target.value })} placeholder="Project name" /></Field>
              <Field label="Type" hint="e.g. Web App, Brand"><Input value={(item as any).type} onChange={e => patch((item as any).id, { type: e.target.value })} /></Field>
              <div className="md:col-span-2"><Field label="Description"><Textarea rows={3} value={(item as any).text} onChange={e => patch((item as any).id, { text: e.target.value })} /></Field></div>
              <div className="md:col-span-2"><Field label="Project link" hint="Add a link like a GitHub repo or live site"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><Link2 size={15} /></span><Input className="pl-9" value={(item as any).link || ''} onChange={e => patch((item as any).id, { link: e.target.value })} placeholder="https://github.com/you/project" /></div></Field></div>
              <Field label="Accent colour"><AccentPicker value={(item as any).accent} onChange={a => patch((item as any).id, { accent: a })} /></Field>
              <Field label="Tags"><TagInput tags={(item as any).tags || []} onChange={t => patch((item as any).id, { tags: t })} /></Field>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <Btn variant="ghost" onClick={() => setConfirm({ type: 'work', id: (item as any).id })}>Delete</Btn>
              <Btn onClick={() => onSave(item)}><Save size={14} /> Save</Btn>
            </div>
          </section>
        ))}
      </div>

      <div className="flex justify-center mt-2">
        <Btn variant="ghost" onClick={onAdd}><Plus size={15} /> Add another project</Btn>
      </div>
    </div>
  )
}
