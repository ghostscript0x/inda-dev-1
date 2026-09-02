import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { Plus } from 'lucide-react'

export function Card({ title, desc, children, action }: { title: string; desc?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl overflow-hidden" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{desc}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>{label}</span>
      {children}
      {hint && <span className="block text-[11px] mt-1.5" style={{ color: 'var(--muted)' }}>{hint}</span>}
    </label>
  )
}

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  fontSize: 14,
  color: 'var(--foreground)',
  background: 'transparent',
  border: '1px solid var(--line)',
  borderRadius: 10,
  outline: 'none',
  transition: 'border-color .15s ease, box-shadow .15s ease',
}

export const inputFocus = {
  borderColor: 'var(--green)',
  boxShadow: `0 0 0 3px rgba(16,240,160,.12)`,
} as React.CSSProperties

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...props.style }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,240,160,.12)' }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputBase, resize: 'vertical', ...props.style }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,240,160,.12)' }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputBase, ...props.style }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--green)' }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)' }} />
}

export function Btn({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'; className?: string; disabled?: boolean; type?: 'button' | 'submit' }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--green)', color: 'var(--background)', fontWeight: 700, border: '1px solid var(--green)' },
    ghost: { background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--line)' },
    danger: { background: 'transparent', color: '#ff4757', border: '1px solid rgba(255,71,87,.4)' },
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 ${className}`} style={{ ...styles[variant], cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
    </button>
  )
}

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all" style={{ background: 'var(--green)', color: 'var(--background)' }}>
      <Plus size={15} /> Add
    </button>
  )
}
