'use client'

import { RefreshCw, Sparkles } from 'lucide-react'

function riskLevel(text: string): 'high' | 'med' | 'ok' {
  const t = text.toLowerCase()
  if (/stuck|risk|void|overdue|never|missing|flagg|lost/.test(t)) return 'high'
  if (/watch|review|delay|rework|unusual|concern|below/.test(t)) return 'med'
  return 'ok'
}

const ACCENT: Record<string, string> = { high: '#ef4444', med: '#f59e0b', ok: '#22c55e' }
const DOT: Record<string, string>    = { high: '🔴', med: '🟡', ok: '🟢' }

function highlightMoney(text: string) {
  return text.replace(/(£[\d,\.]+)/g, '<span style="color:#00D4FF;font-weight:600">$1</span>')
}

function parseReport(report: string) {
  const sections: { title: string; lines: string[] }[] = []
  let current: { title: string; lines: string[] } | null = null

  for (const raw of report.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const headingMatch = line.match(/^\*\*(.+?)\*\*$/) ?? line.match(/^#{1,3}\s*(.+)/)
    if (headingMatch) {
      if (current) sections.push(current)
      current = { title: headingMatch[1].replace(/^\d+\.\s*/, ''), lines: [] }
    } else if (current) {
      current.lines.push(line)
    } else {
      current = { title: '', lines: [line] }
    }
  }
  if (current) sections.push(current)
  return sections
}

interface AiPanelProps {
  report: string
  onRegenerate: () => void
  regenerating: boolean
}

export default function AiPanel({ report, onRegenerate, regenerating }: AiPanelProps) {
  const sections = report ? parseReport(report) : []

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.25)', borderLeft: '3px solid #1E7FD8' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(30,127,216,0.15)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} color="#00D4FF" />
          <span className="text-sm font-bold" style={{ color: '#f1f5f9' }}>AI Insights</span>
        </div>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ color: '#1E7FD8' }}
          onMouseEnter={e => ((e.target as HTMLElement).style.color = '#00D4FF')}
          onMouseLeave={e => ((e.target as HTMLElement).style.color = '#1E7FD8')}>
          <RefreshCw size={11} className={regenerating ? 'animate-spin' : ''} />
          Regenerate
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!report && !regenerating && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Sparkles size={28} color="#475569" />
            <p className="text-sm text-center" style={{ color: '#475569' }}>
              Click <span style={{ color: '#7dd3fc' }}>Regenerate</span> to generate AI insights
            </p>
          </div>
        )}

        {regenerating && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <RefreshCw size={24} color="#1E7FD8" className="animate-spin" />
            <p className="text-sm" style={{ color: '#64748b' }}>Generating insights…</p>
          </div>
        )}

        {!regenerating && sections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: '#00D4FF' }}>
                {section.title}
              </p>
            )}
            <div className="space-y-1.5">
              {section.lines.map((line, li) => {
                const isBullet = /^[-•*]/.test(line)
                const isNumbered = /^\d+\./.test(line)

                if (isBullet) {
                  const text = line.replace(/^[-•*]\s*/, '')
                  const lvl = riskLevel(text)
                  return (
                    <div key={li} className="flex gap-2 items-start"
                      style={{ borderLeft: `3px solid ${ACCENT[lvl]}`, paddingLeft: 8 }}>
                      <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}
                        dangerouslySetInnerHTML={{ __html: highlightMoney(text) }} />
                    </div>
                  )
                }

                if (isNumbered) {
                  const num = line.match(/^(\d+)\./)?.[1]
                  const text = line.replace(/^\d+\.\s*/, '')
                  return (
                    <div key={li} className="flex gap-2 items-start">
                      <span className="text-xs font-bold shrink-0" style={{ color: '#1E7FD8' }}>{num}.</span>
                      <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}
                        dangerouslySetInnerHTML={{ __html: highlightMoney(text) }} />
                    </div>
                  )
                }

                return (
                  <p key={li} className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}
                    dangerouslySetInnerHTML={{ __html: highlightMoney(line) }} />
                )
              })}
            </div>
            {si < sections.length - 1 && (
              <div className="mt-3" style={{ borderBottom: '1px solid rgba(30,127,216,0.12)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
