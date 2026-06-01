'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Bottleneck } from '@/lib/types'

const CARD = { background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)', borderRadius: 10, padding: 16 }
const TOOLTIP_STYLE = { background: '#0D1B2E', border: '1px solid #1E7FD8', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }

function barColour(days: number): string {
  if (days > 10) return '#ef4444'
  if (days > 3)  return '#f59e0b'
  return '#1E7FD8'
}

export default function BottlenecksChart({ data }: { data: Bottleneck[] }) {
  const positive = data.filter(b => b.avgWaitDays > 0)

  return (
    <div style={CARD} className="h-[280px] flex flex-col">
      <p className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: '#64748b' }}>
        Bottlenecks — Avg Wait (days)
      </p>
      {positive.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: '#475569' }}>
          No bottleneck data — all events same-day
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={positive} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,127,216,0.08)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'days', position: 'insideBottomRight', offset: 0, fill: '#64748b', fontSize: 11 }} />
            <YAxis type="category" dataKey="activity" width={150} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v).toFixed(1)} days`, 'Avg wait']} cursor={{ fill: 'rgba(30,127,216,0.06)' }} />
            <Bar dataKey="avgWaitDays" radius={[0, 4, 4, 0]} barSize={14}>
              {positive.map((entry, i) => (
                <Cell key={i} fill={barColour(entry.avgWaitDays)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
