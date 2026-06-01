'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CARD = { background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)', borderRadius: 10, padding: 16 }
const TOOLTIP_STYLE = { background: '#0D1B2E', border: '1px solid #1E7FD8', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }

const STATE_COLOURS: Record<string, string> = {
  'Payment Received':         '#00D4FF',
  'Invoice Approved':         '#1E7FD8',
  'Invoice Created':          '#64748b',
  'Invoice Voided':           '#ef4444',
  'Invoice Edited':           '#f59e0b',
  'Invoice Sent to Customer': '#38bdf8',
}

export default function EndStatesChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div style={CARD} className="h-[280px] flex flex-col">
      <p className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: '#64748b' }}>
        Invoice End States
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={entries} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,127,216,0.08)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'invoices', position: 'insideBottomRight', offset: 0, fill: '#64748b', fontSize: 11 }} />
          <YAxis type="category" dataKey="state" width={165} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'invoices']} cursor={{ fill: 'rgba(30,127,216,0.06)' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
            {entries.map((entry, i) => (
              <Cell key={i} fill={STATE_COLOURS[entry.state] ?? '#64748b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
