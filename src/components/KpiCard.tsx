import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  delta?: string
  deltaType?: 'good' | 'bad' | 'neutral'
}

export default function KpiCard({ label, value, delta, deltaType = 'neutral' }: KpiCardProps) {
  const deltaColour = deltaType === 'bad' ? '#ef4444' : deltaType === 'good' ? '#22c55e' : '#64748b'

  return (
    <div className="flex flex-col gap-1 rounded-xl p-4 flex-1 min-w-0"
      style={{
        background: '#0D1B2E',
        border: '1px solid rgba(30,127,216,0.2)',
        borderBottom: '2px solid #1E7FD8',
      }}>
      <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#64748b' }}>
        {label}
      </span>
      <span className="text-2xl font-bold leading-tight" style={{ color: '#00D4FF' }}>
        {value}
      </span>
      {delta && (
        <span className="text-xs font-medium" style={{ color: deltaColour }}>
          {delta}
        </span>
      )}
    </div>
  )
}
