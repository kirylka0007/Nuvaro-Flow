import Anthropic from '@anthropic-ai/sdk'
import type { EventSummary, ProcessMiningResult, AiInsights } from '@/lib/types'

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[]
  context: {
    summary: EventSummary
    processMining: ProcessMiningResult
    insights: AiInsights
  }
  businessContext?: string
  focusRecommendationId?: string
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Chat is not configured on this deployment (no ANTHROPIC_API_KEY).' },
      { status: 503 },
    )
  }

  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { messages, context, focusRecommendationId, businessContext } = body
  const { summary, processMining: pm, insights } = context
  const sym = summary.currency === 'GBP' ? '£' : summary.currency

  const focusedRec = focusRecommendationId
    ? insights.recommendations.find(r => r.id === focusRecommendationId)
    : undefined

  const systemPrompt = `You are a process intelligence analyst assistant for Nuvaro Flow, helping a finance team understand their Order-to-Cash (O2C) process.

You have access to a process mining analysis of their Xero invoice data. Answer questions using ONLY the data provided below. When quoting amounts, use ${sym}. If the data is insufficient to answer, say so explicitly rather than speculating. Speak in plain English to a small-business owner — focus on cash flow, customers and time, not accounting jargon.
${businessContext?.trim() ? `\n## What the owner told us about their business\n"${businessContext.trim()}"\nUse this to make your answers specific to their situation.\n` : ''}
## Process Data

### Invoice Portfolio
- Total invoices: ${summary.totalInvoices}
- Total value: ${sym}${summary.totalValue.toLocaleString()}
- Average cycle time: ${summary.avgCycleDays} days (max: ${summary.maxCycleDays} days)
- Activity breakdown: ${JSON.stringify(summary.activityCounts)}
- Terminal states: ${JSON.stringify(summary.endStates)}

### Process Mining
- Happy path: ${pm.happyPath.join(' → ')}
- Variants: ${JSON.stringify(pm.variants)}
- Rework rate: ${(pm.reworkRate * 100).toFixed(1)}%
- Bottlenecks: ${JSON.stringify(pm.bottlenecks)}

### AI Recommendations
${insights.recommendations.map(r =>
  `- [${r.severity.toUpperCase()}] ${r.title}: ${r.finding} | Action: ${r.action}${r.valueAtRisk ? ` | Value at risk: ${sym}${r.valueAtRisk.toLocaleString()}` : ''}`
).join('\n')}

${focusedRec ? `## Current Focus\nThe user wants to dig deeper into this recommendation:\n- Title: ${focusedRec.title}\n- Finding: ${focusedRec.finding}\n- Impact: ${focusedRec.impact}\n- Suggested action: ${focusedRec.action}\n- Evidence: ${focusedRec.evidence.join('; ')}` : ''}

Be concise and actionable. Use ${sym} for all amounts. Keep responses under 300 words unless a detailed breakdown is specifically requested.`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        })

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
