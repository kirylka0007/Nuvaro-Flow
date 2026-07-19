'use client'

import type { AiInsights, EventSummary, ProcessMiningResult, Severity } from '@/lib/types'

const SEVERITY_COLOURS: Record<Severity, string> = {
  critical:    '#ef4444',
  warning:     '#f59e0b',
  opportunity: '#00D4FF',
  healthy:     '#22c55e',
}

interface ProcessHealthProps {
  insights: AiInsights
  summary: EventSummary
  processMining: ProcessMiningResult
}

export default function ProcessHealth({ insights, summary, processMining }: ProcessHealthProps) {
  const recs = insights.recommendations ?? []
  const critical = recs.filter(r => r.severity === 'critical').length
  const warning  = recs.filter(r => r.severity === 'warning').length

  const verdict =
    critical > 0 ? { label: 'At Risk',          colour: '#ef4444' } :
    warning  > 0 ? { label: 'Needs Attention',  colour: '#f59e0b' } :
                   { label: 'Healthy',           colour: '#22c55e' }

  const valueAtRisk = recs.reduce((sum, r) => sum + (r.valueAtRisk ?? 0), 0)
  const totalValue  = summary.totalValue
  const sym         = summary.currency === 'GBP' ? '£' : summary.currency

  const totalInv   = summary.totalInvoices
  const happyCount = Object.values(processMining.variants)[0] ?? 0
  const happyPct   = totalInv ? Math.round((happyCount / totalInv) * 100) : 0
  const exceptions = totalInv - happyCount

  return (
    <section
      className="mb-6 rounded-xl p-5"
      style={{
        background: '#0D1B2E',
        border: '1px solid rgba(30,127,216,0.2)',
        borderTop: `2px solid ${verdict.colour}`,
      }}
    >
      {/* Verdict + headline */}
      <div className="flex items-start gap-4 mb-5">
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: verdict.colour, boxShadow: `0 0 8px ${verdict.colour}` }}
          />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: verdict.colour }}
          >
            {verdict.label}
          </span>
        </div>
        <p className="text-base leading-snug font-medium" style={{ color: '#f1f5f9' }}>
          {insights.headline}
        </p>
      </div>

      {/* Conformance bar — the signature: clean vs broken at a glance */}
      <div className="mb-2">
        <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: '#0a1422' }}>
          <div style={{ width: `${happyPct}%`, background: '#22c55e' }} />
          <div style={{ width: `${100 - happyPct}%`, background: verdict.colour }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px]" style={{ color: '#22c55e' }}>
            {happyPct}% on the happy path
          </span>
          <span className="text-[11px]" style={{ color: verdict.colour }}>
            {exceptions} exception{exceptions === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* So-what stats */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 mt-5 pt-4" style={{ borderTop: '1px solid rgba(30,127,216,0.12)' }}>
        <Stat
          value={`${sym}${valueAtRisk.toLocaleString()}`}
          label={`at risk of ${sym}${totalValue.toLocaleString()} book`}
          valueColour="#00D4FF"
        />
        <Stat
          value={String(critical)}
          label={`critical issue${critical === 1 ? '' : 's'}`}
          valueColour={critical > 0 ? '#ef4444' : '#64748b'}
        />
        <Stat
          value={String(warning)}
          label={`warning${warning === 1 ? '' : 's'}`}
          valueColour={warning > 0 ? '#f59e0b' : '#64748b'}
        />
        <Stat
          value={`${happyPct}%`}
          label="process conformance"
          valueColour="#f1f5f9"
        />
      </div>
    </section>
  )
}

function Stat({ value, label, valueColour }: { value: string; label: string; valueColour: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold leading-none" style={{ color: valueColour }}>
        {value}
      </span>
      <span className="text-[11px] mt-1.5" style={{ color: '#64748b' }}>
        {label}
      </span>
    </div>
  )
}
