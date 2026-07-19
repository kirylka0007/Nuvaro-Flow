'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, X } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import BusinessContext from './BusinessContext'
import ProcessHealth from './ProcessHealth'
import RecommendationsHero from './RecommendationsHero'
import EndStatesChart from './EndStatesChart'
import VariantsTable from './VariantsTable'
import EventLog from './EventLog'
import ChatDrawer from './ChatDrawer'
import type { AnalysisResult, Recommendation } from '@/lib/types'
import { DEMO_ANALYSIS } from '@/lib/demo-data'

const LS_KEY = 'nuvaro_flow_analysis_v2'
const CTX_KEY = 'nuvaro_flow_business_context'

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div className="rounded-xl animate-pulse" style={{ height, background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.1)' }} />
  )
}

export default function Dashboard({ tenantName, demo }: { tenantName?: string; demo?: boolean }) {
  const [result, setResult] = useState<AnalysisResult | null>(demo ? DEMO_ANALYSIS : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [seedRec, setSeedRec] = useState<Recommendation | undefined>(undefined)
  const [businessContext, setBusinessContext] = useState('')

  useEffect(() => {
    if (demo) return
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Load anything with the v2 shape (has aiInsights); discard older shapes.
        if (parsed?.aiInsights) {
          setResult(parsed)
        } else {
          localStorage.removeItem(LS_KEY)
        }
      }
      const ctx = localStorage.getItem(CTX_KEY)
      if (ctx) setBusinessContext(ctx)
    } catch {}
  }, [demo])

  const runAnalysis = useCallback(async (ctx: string) => {
    if (demo) return   // Demo mode is read-only — no Xero call
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessContext: ctx }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Server error ${res.status}`)
      }
      const data: AnalysisResult = await res.json()
      localStorage.setItem(LS_KEY, JSON.stringify(data))
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [demo])

  const handleRefresh = useCallback(() => runAnalysis(businessContext), [runAnalysis, businessContext])

  const handleSaveContext = useCallback((next: string) => {
    setBusinessContext(next)
    if (demo) return
    try { localStorage.setItem(CTX_KEY, next) } catch {}
    runAnalysis(next)
  }, [runAnalysis, demo])

  const handleDigDeeper = useCallback((rec: Recommendation) => {
    setSeedRec(rec)
    setChatOpen(true)
  }, [])

  const handleOpenGeneralChat = useCallback(() => {
    setSeedRec(undefined)
    setChatOpen(true)
  }, [])

  const { summary, processMining: pm } = result ?? {}
  const totalInv   = summary?.totalInvoices ?? 0
  const happyCount = pm ? Object.values(pm.variants)[0] ?? 0 : 0
  const voidedCount = summary?.endStates?.['Invoice Voided'] ?? 0

  const chatContext = result
    ? { summary: result.summary, processMining: result.processMining, insights: result.aiInsights }
    : undefined

  return (
    <div className="flex min-h-screen" style={{ background: '#080F1E' }}>
      <Sidebar connected={true} onAiClick={handleOpenGeneralChat} />

      <main className="flex-1 ml-[72px] p-6 overflow-y-auto">
        <Header
          analysedAt={result?.analysedAt}
          loading={loading}
          onRefresh={handleRefresh}
          demo={demo}
        />

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,0.12)', borderLeft: '3px solid #ef4444', color: '#fca5a5' }}>
            <AlertCircle size={15} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* Business context — feeds recommendations + chat */}
        {!loading && !demo && (
          <BusinessContext value={businessContext} onSave={handleSaveContext} busy={loading} />
        )}

        {loading ? (
          <div className="flex flex-col gap-6">
            <SkeletonBlock height={200} />
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={160} />)}
            </div>
          </div>
        ) : result ? (
          <>
            {/* Zone 1 — Process health */}
            <ProcessHealth insights={result.aiInsights} summary={result.summary} processMining={result.processMining} />

            {/* Zone 2 — Recommendations */}
            {result.aiInsights?.recommendations?.length ? (
              <RecommendationsHero insights={result.aiInsights} onDigDeeper={handleDigDeeper} />
            ) : (
              <div className="flex items-center gap-3 mb-6 px-4 py-4 rounded-xl text-sm"
                style={{ background: 'rgba(245,158,11,0.1)', borderLeft: '3px solid #f59e0b', color: '#fcd34d' }}>
                <AlertCircle size={16} />
                <span className="flex-1">
                  {result.insightsError
                    ? `AI recommendations unavailable: ${result.insightsError}`
                    : 'No AI recommendations were generated.'}
                </span>
                <button onClick={handleRefresh} className="text-xs font-semibold underline">Retry</button>
              </div>
            )}

            {/* Zone 3 — Evidence (only charts that explain a flagged issue) */}
            <section className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold mb-3" style={{ color: '#64748b' }}>
                Evidence
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <EndStatesChart data={pm!.endStates} />
                  <p className="text-xs leading-relaxed px-1" style={{ color: '#64748b' }}>
                    Where invoices actually land. {totalInv - happyCount} of {totalInv} finished off the happy
                    path{voidedCount > 0 ? `, including ${voidedCount} voided` : ''} — these are the exceptions the warnings above call out.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <VariantsTable variants={pm!.variants} total={totalInv} />
                  <p className="text-xs leading-relaxed px-1" style={{ color: '#64748b' }}>
                    The distinct paths invoices took. {happyCount} of {totalInv} follow the clean route; every other
                    row is a deviation worth understanding before it scales.
                  </p>
                </div>
              </div>
            </section>

            {/* Audit trail */}
            <EventLog events={result.events} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 rounded-xl gap-4 mt-2"
            style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)' }}>
            <span className="text-4xl">📊</span>
            <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>No data yet</p>
            <p className="text-sm" style={{ color: '#64748b' }}>Click <strong style={{ color: '#7dd3fc' }}>Refresh data</strong> to run the first analysis</p>
          </div>
        )}
      </main>

      {/* Chat drawer */}
      {chatContext && (
        <ChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          context={chatContext}
          businessContext={businessContext}
          seedRecommendation={seedRec}
        />
      )}
    </div>
  )
}
