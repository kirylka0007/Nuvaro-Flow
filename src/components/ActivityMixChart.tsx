'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CARD = { background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)', borderRadius: 10, padding: 16 }
const TOOLTIP_STYLE = { background: '#0D1B2E', border: '1px solid #1E7FD8', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }
const COLOURS = ['#1E7FD8', '#00D4FF', '#38bdf8', '#ef4444', '#f59e0b', '#a855f7', '#ec4899']

export default function ActivityMixChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).map(([name, value]) => ({ name, value }))

  return (
    <div style={CARD} className="h-[280px] flex flex-col">
      <p className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: '#64748b' }}>
        Activity Mix
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={entries}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            paddingAngle={2}
          >
            {entries.map((_, i) => (
              <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [v, name]} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
