import { getSession } from '@/lib/session'
import { refreshXeroToken, getInvoices, getAllHistories } from '@/lib/xero'
import { buildEventLog, summariseEvents } from '@/lib/event-log'
import { runAnalysis } from '@/lib/process-miner'
import { generateInsights } from '@/lib/ai-explainer'
import type { AnalysisResult } from '@/lib/types'

export async function POST() {
  const session = await getSession()

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
    const aiReport = await generateInsights(processMining, summary)

    const result: AnalysisResult = {
      events,
      summary,
      processMining,
      aiReport,
      analysedAt: new Date().toISOString(),
    }

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
