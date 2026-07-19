'use client'

import { MessageSquare, Banknote, ReceiptText, ShieldCheck, Gauge } from 'lucide-react'
import type { AiInsights, Recommendation, RecommendationCategory, Severity } from '@/lib/types'

const SEVERITY_COLOURS: Record<Severity, string> = {
  critical:    '#ef4444',
  warning:     '#f59e0b',
  opportunity: '#00D4FF',
  healthy:     '#22c55e',
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical:    'Critical',
  warning:     'Warning',
  opportunity: 'Opportunity',
  healthy:     'Healthy',
}

const CATEGORY_META: Record<RecommendationCategory, { label: string; blurb: string; icon: typeof Banknote }> = {
  'cash-collection': { label: 'Getting Paid',        blurb: 'Issuing invoices and collecting the cash you are owed', icon: Banknote },
  'billing-accuracy': { label: 'Billing & Disputes', blurb: 'Correct invoices and keeping customers’ trust',         icon: ReceiptText },
  'efficiency':       { label: 'Speed & Bottlenecks', blurb: 'How quickly work moves and where it stalls',           icon: Gauge },
  'controls':         { label: 'Controls & Data',     blurb: 'Approvals, audit trail and the data you rely on',      icon: ShieldCheck },
}

// Display order: what a small-business owner cares about most, first.
const CATEGORY_ORDER: RecommendationCategory[] = ['cash-collection', 'billing-accuracy', 'efficiency', 'controls']

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, opportunity: 2, healthy: 3 }

function highlightMoney(text: string) {
  return text.replace(/(£[\d,\.]+)/g, '<span style="color:#00D4FF;font-weight:600">$1</span>')
}

function RecCard({ rec, onDigDeeper }: { rec: Recommendation; onDigDeeper: (r: Recommendation) => void }) {
  const colour = SEVERITY_COLOURS[rec.severity]

  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-4"
      style={{
        flex: '1 1 320px',
        minWidth: 280,
        maxWidth: 520,
        background: '#0D1B2E',
        border: '1px solid rgba(30,127,216,0.2)',
        borderLeft: `3px solid ${colour}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: `${colour}22`, color: colour }}
        >
          {SEVERITY_LABEL[rec.severity]}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold leading-snug" style={{ color: '#f1f5f9' }}>
        {rec.title}
      </p>

      {/* Impact */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: '#94a3b8' }}
        dangerouslySetInnerHTML={{ __html: highlightMoney(rec.impact) }}
      />

      {/* Value at risk */}
      {rec.valueAtRisk !== null && (
        <p className="text-xs" style={{ color: '#64748b' }}>
          Value at risk:{' '}
          <span style={{ color: '#00D4FF', fontWeight: 600 }}>
            £{rec.valueAtRisk.toLocaleString()}
          </span>
        </p>
      )}

      {/* Action */}
      <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
        <span style={{ color: colour, fontWeight: 600 }}>→ </span>
        {rec.action}
      </p>

      {/* Dig deeper */}
      <button
        onClick={() => onDigDeeper(rec)}
        className="mt-auto flex items-center gap-1.5 self-start text-xs font-semibold transition-colors"
        style={{ color: '#1E7FD8' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#00D4FF')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#1E7FD8')}
      >
        <MessageSquare size={12} />
        Dig deeper
      </button>
    </div>
  )
}

interface RecommendationsHeroProps {
  insights: AiInsights
  onDigDeeper: (rec: Recommendation) => void
}

export default function RecommendationsHero({ insights, onDigDeeper }: RecommendationsHeroProps) {
  const recs = insights.recommendations ?? []

  // Bucket by category, falling back to 'controls' for any legacy/unknown value.
  const buckets = new Map<RecommendationCategory, Recommendation[]>()
  for (const rec of recs) {
    const cat: RecommendationCategory = CATEGORY_META[rec.category] ? rec.category : 'controls'
    if (!buckets.has(cat)) buckets.set(cat, [])
    buckets.get(cat)!.push(rec)
  }

  const orderedCats = CATEGORY_ORDER.filter(c => buckets.has(c))

  return (
    <div className="mb-2">
      {orderedCats.map(cat => {
        const meta = CATEGORY_META[cat]
        const Icon = meta.icon
        const items = buckets.get(cat)!.slice().sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

        return (
          <section key={cat} className="mb-6">
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <Icon size={15} color="#1E7FD8" />
              <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{meta.label}</h3>
              <span className="text-xs" style={{ color: '#475569' }}>· {meta.blurb}</span>
            </div>

            {/* Cards — flex-grow so the row always fills the full width */}
            <div className="flex flex-wrap gap-3">
              {items.map(rec => (
                <RecCard key={rec.id} rec={rec} onDigDeeper={onDigDeeper} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
