'use client'

import { useState } from 'react'
import { Building2, ChevronDown, Check } from 'lucide-react'

interface BusinessContextProps {
  value: string
  onSave: (next: string) => void
  busy?: boolean
}

export default function BusinessContext({ value, onSave, busy }: BusinessContextProps) {
  const [open, setOpen] = useState(!value)
  const [draft, setDraft] = useState(value)

  const dirty = draft.trim() !== value.trim()

  return (
    <section
      className="mb-6 rounded-xl"
      style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left"
      >
        <Building2 size={16} color="#1E7FD8" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
            Your business context
          </p>
          <p className="text-xs truncate" style={{ color: '#64748b' }}>
            {value
              ? value
              : 'Tell the AI about your business so recommendations are tailored to you'}
          </p>
        </div>
        <ChevronDown
          size={16}
          color="#64748b"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Editor */}
      {open && (
        <div className="px-4 pb-4">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            placeholder="e.g. We're a 10-person design studio billing monthly retainers. Cash flow is tight, so getting invoices out and paid on time matters most. We rarely void invoices."
            className="w-full rounded-lg px-3 py-2 text-xs leading-relaxed outline-none resize-y"
            style={{
              background: '#080F1E',
              border: '1px solid rgba(30,127,216,0.25)',
              color: '#f1f5f9',
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px]" style={{ color: '#475569' }}>
              Saved with your analysis — feeds both recommendations and chat.
            </p>
            <button
              onClick={() => onSave(draft.trim())}
              disabled={!dirty || busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40"
              style={{ background: '#1E7FD8', color: '#fff' }}
            >
              <Check size={13} />
              {busy ? 'Re-analysing…' : 'Save & re-analyse'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
