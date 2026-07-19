'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, MessageSquare } from 'lucide-react'
import type { AiInsights, EventSummary, ProcessMiningResult, Recommendation, Severity } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatDrawerProps {
  open: boolean
  onClose: () => void
  context: {
    summary: EventSummary
    processMining: ProcessMiningResult
    insights: AiInsights
  }
  businessContext?: string
  seedRecommendation?: Recommendation
}

const SEVERITY_COLOURS: Record<Severity, string> = {
  critical:    '#ef4444',
  warning:     '#f59e0b',
  opportunity: '#00D4FF',
  healthy:     '#22c55e',
}

function highlightMoney(text: string) {
  return text.replace(/(£[\d,\.]+)/g, '<span style="color:#00D4FF;font-weight:600">$1</span>')
}

export default function ChatDrawer({ open, onClose, context, businessContext, seedRecommendation }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const seedSentRef = useRef<string | undefined>(undefined)

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  // Auto-send seed message when a new recommendation is focused
  useEffect(() => {
    if (!open || !seedRecommendation) return
    const seedId = seedRecommendation.id
    if (seedSentRef.current === seedId) return
    seedSentRef.current = seedId

    setMessages([])
    const seedMessage = `I'd like to dig deeper into this recommendation: "${seedRecommendation.title}". ${seedRecommendation.finding} What should we do about it, and what specifically in the data supports this?`
    sendMessage(seedMessage, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedRecommendation])

  // Reset seed tracker when drawer closes or seed changes
  useEffect(() => {
    if (!open) {
      seedSentRef.current = undefined
    }
  }, [open])

  const sendMessage = useCallback(async (text: string, existingMessages: Message[]) => {
    const userMsg: Message = { role: 'user', content: text }
    const updated = [...existingMessages, userMsg]
    setMessages(updated)
    setStreaming(true)

    // Add placeholder assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          context,
          businessContext,
          focusRecommendationId: seedRecommendation?.id,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === 'assistant') {
            next[next.length - 1] = { ...last, content: last.content + chunk }
          }
          return next
        })
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      setMessages(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, content: `[Error: ${errMsg}]` }
        }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }, [context, businessContext, seedRecommendation])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    sendMessage(text, messages)
  }, [input, streaming, messages, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-screen z-50 flex flex-col transition-transform duration-300"
        style={{
          width: 420,
          background: '#080F1E',
          borderLeft: '1px solid rgba(30,127,216,0.2)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(30,127,216,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={16} color="#00D4FF" />
            <span className="text-sm font-bold" style={{ color: '#f1f5f9' }}>
              AI Assistant
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f1f5f9')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Seed context chip */}
        {seedRecommendation && (
          <div
            className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs shrink-0"
            style={{
              background: `${SEVERITY_COLOURS[seedRecommendation.severity]}18`,
              borderLeft: `3px solid ${SEVERITY_COLOURS[seedRecommendation.severity]}`,
              color: '#94a3b8',
            }}
          >
            <span style={{ color: SEVERITY_COLOURS[seedRecommendation.severity], fontWeight: 600 }}>
              Digging into:{' '}
            </span>
            {seedRecommendation.title}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageSquare size={32} color="#1E7FD8" />
              <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                Ask about your process data
              </p>
              <p className="text-xs" style={{ color: '#475569' }}>
                Questions grounded in your Xero invoice analysis
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed"
                style={
                  msg.role === 'user'
                    ? { background: '#1E7FD8', color: '#f1f5f9' }
                    : { background: '#0D1B2E', color: '#94a3b8', border: '1px solid rgba(30,127,216,0.2)' }
                }
              >
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <span dangerouslySetInnerHTML={{ __html: highlightMoney(msg.content) }} />
                  ) : (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                    </span>
                  )
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid rgba(30,127,216,0.15)' }}
        >
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: '#0D1B2E', border: '1px solid rgba(30,127,216,0.2)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your process data…"
              disabled={streaming}
              className="flex-1 bg-transparent text-xs outline-none disabled:opacity-50"
              style={{ color: '#f1f5f9' }}
            />
            <button
              onClick={handleSend}
              disabled={streaming || !input.trim()}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors disabled:opacity-40"
              style={{ background: '#1E7FD8' }}
              onMouseEnter={e => { if (!streaming && input.trim()) (e.currentTarget as HTMLElement).style.background = '#00D4FF' }}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#1E7FD8')}
            >
              <Send size={13} color="#fff" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-center" style={{ color: '#334155' }}>
            Answers grounded in your Xero process data
          </p>
        </div>
      </div>
    </>
  )
}
