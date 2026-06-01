'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, X } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import KpiCard from './KpiCard'
import BottlenecksChart from './BottlenecksChart'
import ActivityMixChart from './ActivityMixChart'
import EndStatesChart from './EndStatesChart'
import VariantsTable from './VariantsTable'
import AiPanel from './AiPanel'
import EventLog from './EventLog'
import type { AnalysisResult } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

const LS_KEY = 'nuvaro_flow_analysis'

// Skeleton pulse card
function SkeletonCard() {
  return (
    <div className="flex-1 h-[100px] rounded-xl animate-pulse"
      style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.1)' }} />
  )
}
function SkeletonChart() {
  return (
    <div className="h-[280px] rounded-xl animate-pulse"
      style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.1)' }} />
  )
}

export default function Dashboard({ tenantName }: { tenantName?: string }) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setResult(JSON.parse(stored))
    } catch {}
  }, [])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyse', { method: 'POST' })
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
  }, [])

  const handleRegenerate = useCallback(async () => {
    if (!result) return
    setRegenerating(true)
    try {
      // Re-use existing data, just re-call Claude
      const res = await fetch('/api/analyse', { method: 'POST' })
      if (!res.ok) throw new Error('Regeneration failed')
      const data: AnalysisResult = await res.json()
      localStorage.setItem(LS_KEY, JSON.stringify(data))
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setRegenerating(false)
    }
  }, [result])

  const { summary, processMining: pm } = result ?? {}
  const currency = summary?.currency ?? 'GBP'
  const sym = currency === 'GBP' ? '£' : currency

  const happyCount  = pm ? Object.values(pm.variants)[0] ?? 0 : 0
  const totalInv    = summary?.totalInvoices ?? 0
  const offPathPct  = totalInv ? Math.round(((totalInv - happyCount) / totalInv) * 100) : 0
  const offPathCount = totalInv - happyCount

  return (
    <div className="flex min-h-screen" style={{ background: '#080F1E' }}>
      <Sidebar connected={true} />

      <main className="flex-1 ml-[72px] p-6 overflow-y-auto">
        <Header
          analysedAt={result?.analysedAt}
          loading={loading}
          onRefresh={handleRefresh}
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

        {/* KPI cards */}
        <div className="flex gap-3 mb-6">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : result ? (
            <>
              <KpiCard label="Total Invoices"   value={String(totalInv)} />
              <KpiCard label="Portfolio Value"  value={formatCurrency(summary!.totalValue, currency)} />
              <KpiCard label="Avg Cycle Time"   value={`${summary!.avgCycleDays} days`} />
              <KpiCard label="Off Happy Path"   value={`${offPathPct}%`}
                delta={offPathCount > 0 ? `${offPathCount} invoices` : undefined}
                deltaType={offPathPct > 30 ? 'bad' : 'neutral'} />
              <KpiCard label="Process Variants" value={String(Object.keys(pm!.variants).length)}
                delta={pm!.reworkRate > 0 ? `Rework ${(pm!.reworkRate * 100).toFixed(0)}%` : undefined}
                deltaType={pm!.reworkRate > 0.1 ? 'bad' : 'neutral'} />
            </>
          ) : (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          )}
        </div>

        {/* Charts + AI panel */}
        <div className="flex gap-4">

          {/* Left: 2×2 charts */}
          <div className="flex flex-col gap-3" style={{ flex: '0 0 65%' }}>
            {loading ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <SkeletonChart /><SkeletonChart />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SkeletonChart /><SkeletonChart />
                </div>
              </>
            ) : result ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <BottlenecksChart data={pm!.bottlenecks} />
                  <ActivityMixChart data={summary!.activityCounts} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <EndStatesChart data={pm!.endStates} />
                  <VariantsTable variants={pm!.variants} total={totalInv} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 rounded-xl gap-4"
                style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)' }}>
                <span className="text-4xl">📊</span>
                <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>No data yet</p>
                <p className="text-sm" style={{ color: '#64748b' }}>Click <strong style={{ color: '#7dd3fc' }}>Refresh data</strong> to run the first analysis</p>
              </div>
            )}
          </div>

          {/* Right: AI panel */}
          <div style={{ flex: '0 0 35%' }}>
            <AiPanel
              report={result?.aiReport ?? ''}
              onRegenerate={handleRegenerate}
              regenerating={regenerating}
            />
          </div>
        </div>

        {/* Event log */}
        {result && <EventLog events={result.events} />}
      </main>
    </div>
  )
}
