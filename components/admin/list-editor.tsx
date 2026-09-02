import { Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { Card, Field, Input, Textarea, AddButton, Btn, Select } from '@/components/admin/ui'

export function ListEditor({ items, setItems, kind, onSave, onAdd, onDelete, setConfirm }: {
  items: any[]
  setItems: Dispatch<SetStateAction<any[]>>
  kind: 'services' | 'experience' | 'work'
  onSave: (i: any) => void
  onAdd: () => void
  onDelete: (id: string) => void
  setConfirm: (c: { type: any; id: string } | null) => void
}) {
  const patch = (id: string, data: Record<string, unknown>) => setItems(items.map(i => (i as any).id === id ? { ...i, ...data } : i))

  const renderFields = (item: any) => {
    if (kind === 'services') {
      return (
        <>
          <Field label="Number"><Input className="w-24" value={item.number} onChange={e => patch(item.id, { number: e.target.value })} /></Field>
          <Field label="Title"><Input value={item.title} onChange={e => patch(item.id, { title: e.target.value })} /></Field>
          <div className="md:col-span-3"><Field label="Description"><Textarea rows={2} value={item.text} onChange={e => patch(item.id, { text: e.target.value })} /></Field></div>
        </>
      )
    }
    if (kind === 'experience') {
      return (
        <>
          <Field label="Period"><Input value={item.period} onChange={e => patch(item.id, { period: e.target.value })} /></Field>
          <Field label="Title"><Input value={item.title} onChange={e => patch(item.id, { title: e.target.value })} /></Field>
          <div className="md:col-span-3"><Field label="Description"><Textarea rows={2} value={item.text} onChange={e => patch(item.id, { text: e.target.value })} /></Field></div>
        </>
      )
    }
    // work
    return (
      <>
        <Field label="Type"><Input value={item.type} onChange={e => patch(item.id, { type: e.target.value })} /></Field>
        <Field label="Title"><Input value={item.title} onChange={e => patch(item.id, { title: e.target.value })} /></Field>
        <Field label="Accent">
          <Select value={item.accent} onChange={e => patch(item.id, { accent: e.target.value })}>
            <option value="lime">Lime</option><option value="blue">Blue</option><option value="orange">Orange</option>
          </Select>
        </Field>
        <div className="md:col-span-3"><Field label="Description"><Textarea rows={2} value={item.text} onChange={e => patch(item.id, { text: e.target.value })} /></Field></div>
        <div className="md:col-span-3"><Field label="Tags" hint="Comma separated"><Input value={item.tags.join(', ')} onChange={e => patch(item.id, { tags: e.target.value.split(',').map((t: string) => t.trim()) })} /></Field></div>
      </>
    )
  }

  const singular = kind === 'services' ? 'Service' : kind === 'experience' ? 'Experience' : 'Project'

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{kind === 'services' ? 'Services' : kind === 'experience' ? 'Experience' : 'Work'}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Add, edit, or remove items</p>
        </div>
        <AddButton onClick={onAdd} />
      </div>

      {items.length === 0 && (
        <div className="rounded-xl py-16 text-center" style={{ border: '1px dashed var(--line)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No {kind} yet. Add your first one.</p>
        </div>
      )}

      {items.map(item => (
        <Card key={(item as any).id} title={`${(item as any).title || 'Untitled'}`} desc={`${singular} #${(item as any).number || (item as any).order + 1 || ''}`.trim()} action={<Btn variant="danger" onClick={() => setConfirm({ type: kind, id: (item as any).id })}><Trash2 size={14} /></Btn>}>
          <div className="grid md:grid-cols-3 gap-5">
            {renderFields(item)}
          </div>
          <div className="flex justify-end mt-5">
            <Btn onClick={() => onSave(item)}>Save changes</Btn>
          </div>
        </Card>
      ))}

      <div className="flex justify-end">
        <Btn onClick={onAdd} variant="ghost">Add another {singular.toLowerCase()}</Btn>
      </div>
    </div>
  )
}
