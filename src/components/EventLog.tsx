'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { XeroEvent } from '@/lib/types'

export default function EventLog({ events }: { events: XeroEvent[] }) {
  const [open, setOpen] = useState(false)
  const [actFilter, setActFilter] = useState<string[]>([])
  const [contactFilter, setContactFilter] = useState<string[]>([])

  const activities = useMemo(() => [...new Set(events.map(e => e.activity))].sort(), [events])
  const contacts   = useMemo(() => [...new Set(events.map(e => e.contactName))].sort(), [events])

  const filtered = useMemo(() => events.filter(e =>
    (actFilter.length === 0 || actFilter.includes(e.activity)) &&
    (contactFilter.length === 0 || contactFilter.includes(e.contactName)),
  ), [events, actFilter, contactFilter])

  return (
    <div className="mt-5 rounded-xl overflow-hidden"
      style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)' }}>

      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
        style={{ color: '#94a3b8' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(30,127,216,0.04)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#64748b' }}>
            Raw Event Log
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(30,127,216,0.15)', color: '#7dd3fc' }}>
            {events.length} events
          </span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(30,127,216,0.12)' }}>
          {/* Filters */}
          <div className="flex gap-4 px-4 py-3" style={{ borderBottom: '1px solid rgba(30,127,216,0.08)' }}>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: '#64748b' }}>Activity</label>
              <select multiple value={actFilter}
                onChange={e => setActFilter([...e.target.selectedOptions].map(o => o.value))}
                className="w-full text-xs rounded-md px-2 py-1 h-20"
                style={{ background: '#080F1E', color: '#94a3b8', border: '1px solid rgba(30,127,216,0.2)' }}>
                {activities.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: '#64748b' }}>Contact</label>
              <select multiple value={contactFilter}
                onChange={e => setContactFilter([...e.target.selectedOptions].map(o => o.value))}
                className="w-full text-xs rounded-md px-2 py-1 h-20"
                style={{ background: '#080F1E', color: '#94a3b8', border: '1px solid rgba(30,127,216,0.2)' }}>
                {contacts.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <button onClick={() => { setActFilter([]); setContactFilter([]) }}
                className="text-xs px-3 py-1 rounded-md transition-colors"
                style={{ color: '#64748b', border: '1px solid rgba(30,127,216,0.2)' }}>
                Clear
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto" style={{ maxHeight: 360 }}>
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0" style={{ background: '#0D1B2E' }}>
                <tr style={{ borderBottom: '1px solid rgba(30,127,216,0.2)' }}>
                  {['Invoice', 'Contact', 'Activity', 'Timestamp', 'User', 'Amount (£)'].map(h => (
                    <th key={h} className="text-left px-3 py-2 uppercase tracking-wider whitespace-nowrap"
                      style={{ color: '#64748b', fontSize: 10, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(30,127,216,0.06)' }}
                    className="hover:bg-[rgba(30,127,216,0.04)] transition-colors">
                    <td className="px-3 py-1.5 font-mono" style={{ color: '#94a3b8' }}>{e.invoiceNumber}</td>
                    <td className="px-3 py-1.5" style={{ color: '#94a3b8' }}>{e.contactName}</td>
                    <td className="px-3 py-1.5" style={{ color: '#f1f5f9' }}>{e.activity}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap font-mono" style={{ color: '#64748b', fontSize: 11 }}>
                      {new Date(e.timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-1.5" style={{ color: '#64748b' }}>{e.user}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: '#94a3b8' }}>
                      {e.amountDue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs" style={{ color: '#475569' }}>
            {filtered.length} of {events.length} events
          </div>
        </div>
      )}
    </div>
  )
}
