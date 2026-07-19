import { getSession } from '@/lib/session'
import { refreshXeroToken, getInvoices, getAllHistories } from '@/lib/xero'
import { buildEventLog, summariseEvents } from '@/lib/event-log'
import { runAnalysis } from '@/lib/process-miner'
import { generateInsights } from '@/lib/ai-explainer'
import type { AnalysisResult } from '@/lib/types'

export async function POST(request: Request) {
  const session = await getSession()

  let businessContext: string | undefined
  try {
    const body = await request.json()
    if (typeof body?.businessContext === 'string') businessContext = body.businessContext
  } catch {
    // No body / not JSON — fine, businessContext stays undefined
  }

  if (!session.accessToken || !session.refreshToken || !session.tenantId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Always try a token refresh first
  let accessToken = session.accessToken
  try {
    const tokens = await refreshXeroToken(session.refreshToken)
    session.accessToken = tokens.access_token
    session.refreshToken = tokens.refresh_token
    await session.save()
    accessToken = tokens.access_token
  } catch {
    // Proceed with existing token — may still be valid within its 30-min window
  }

  const tenantId = session.tenantId

  try {
    const invoices = await getInvoices(accessToken, tenantId)
    if (!invoices.length) {
      return Response.json({ error: 'No invoices found in this Xero organisation.' }, { status: 404 })
    }

    const histories = await getAllHistories(invoices, accessToken, tenantId)
    const events = buildEventLog(invoices, histories)
    const summary = summariseEvents(events)
    const processMining = runAnalysis(events)

    // Insights are non-fatal: if the AI call fails, still return the analysis
    // with charts and surface the reason so the UI can show it.
    let aiInsights: AnalysisResult['aiInsights'] = { headline: '', recommendations: [] }
    let insightsError: string | undefined
    try {
      aiInsights = await generateInsights(processMining, summary, businessContext)
    } catch (err) {
      insightsError = err instanceof Error ? err.message : 'AI insights failed'
      console.error('[analyse] insights generation failed:', err)
    }

    const result: AnalysisResult = {
      events,
      summary,
      processMining,
      aiInsights,
      insightsError,
      analysedAt: new Date().toISOString(),
    }

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
