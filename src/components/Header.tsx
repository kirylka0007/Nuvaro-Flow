'use client'

import { RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface HeaderProps {
  analysedAt?: string
  loading: boolean
  onRefresh: () => void
  demo?: boolean
}

export default function Header({ analysedAt, loading, onRefresh, demo }: HeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold" style={{ color: '#f1f5f9' }}>
            Process Intelligence Overview
          </h1>
          {demo && (
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              Sample data
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs" style={{ color: '#64748b' }}>
            1 Jan 2025 – {formatDate(analysedAt ?? new Date().toISOString())}
          </span>
          {analysedAt && (
            <span className="text-xs" style={{ color: '#475569' }}>
              Last updated {new Date(analysedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {!demo && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #1E7FD8, #00A8CC)', color: '#fff' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analysing…' : 'Refresh data'}
        </button>
      )}
    </div>
  )
}
