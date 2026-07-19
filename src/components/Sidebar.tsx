'use client'

import { LayoutDashboard, GitBranch, Layers, Sparkles, FileText, Bell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: GitBranch,       label: 'Process Mining', active: false },
  { icon: Layers,          label: 'Variants', active: false },
  { icon: Sparkles,        label: 'AI Insights', active: false },
  { icon: FileText,        label: 'Reports', active: false },
  { icon: Bell,            label: 'Alerts', active: false },
]

export default function Sidebar({ connected, onAiClick }: { connected: boolean; onAiClick?: () => void }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[72px] flex flex-col items-center py-4 z-40"
      style={{ background: '#060D1A', borderRight: '1px solid rgba(30,127,216,0.15)' }}>

      {/* Logo */}
      <div className="mb-6 flex items-center justify-center w-10 h-10 rounded-xl"
        style={{ background: 'rgba(30,127,216,0.15)' }}>
        <span className="text-xl">⚡</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 w-full px-2 flex-1">
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <div key={label}
            className="group relative flex items-center justify-center w-full h-11 rounded-lg cursor-pointer transition-all"
            style={active
              ? { background: 'rgba(30,127,216,0.18)', borderLeft: '2px solid #00D4FF' }
              : undefined}
            onClick={label === 'AI Insights' ? onAiClick : undefined}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,127,216,0.08)' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = '' }}
          >
            <Icon size={20} color={active ? '#00D4FF' : '#64748b'} />
            {/* Tooltip */}
            <span className="absolute left-full ml-3 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
              style={{ background: '#0D1B2E', color: '#f1f5f9', border: '1px solid rgba(30,127,216,0.3)' }}>
              {label}
            </span>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-3 pb-2">
        <div className="group relative flex items-center justify-center w-11 h-11 rounded-lg cursor-pointer"
          onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(30,127,216,0.08)')}
          onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = '')}>
          <Settings size={18} color="#64748b" />
        </div>
        {/* Connection dot */}
        <div className="relative flex items-center justify-center w-8 h-8">
          <span className={cn(
            'w-2.5 h-2.5 rounded-full',
            connected ? 'bg-risk-green' : 'bg-risk-red',
          )}
            style={connected ? { boxShadow: '0 0 6px #22c55e' } : undefined} />
          <span className="absolute left-full ml-3 px-2 py-1 rounded-md text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100"
            style={{ background: '#0D1B2E', color: '#94a3b8' }}>
            {connected ? 'Xero connected' : 'Not connected'}
          </span>
        </div>
      </div>
    </aside>
  )
}
