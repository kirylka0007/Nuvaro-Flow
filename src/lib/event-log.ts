import type { XeroInvoice, XeroHistoryRecord } from './xero'
import type { XeroEvent } from './types'

const ACTIVITY_RULES: [RegExp, string][] = [
  [/voided/i,              'Invoice Voided'],
  [/paid|payment/i,        'Payment Received'],
  [/approved|authoris/i,   'Invoice Approved'],
  [/emailed|sent/i,        'Invoice Sent to Customer'],
  [/credit note/i,         'Credit Note Applied'],
  [/edited|updated/i,      'Invoice Edited'],
  [/draft|created/i,       'Invoice Created'],
  [/submitted/i,           'Invoice Submitted'],
  [/deleted/i,             'Invoice Deleted'],
]

function mapActivity(changes: string | undefined): string {
  const text = changes ?? ''
  for (const [pattern, activity] of ACTIVITY_RULES) {
    if (pattern.test(text)) return activity
  }
  return text ? `Other: ${text.slice(0, 60)}` : 'Unknown'
}

function parseXeroDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  // /Date(ms+offset)/
  const msMatch = dateStr.match(/\/Date\((\d+)([+-]\d+)?\)\//)
  if (msMatch) return new Date(parseInt(msMatch[1]))
  // ISO 8601
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export function buildEventLog(
  invoices: XeroInvoice[],
  histories: Record<string, XeroHistoryRecord[]>,
): XeroEvent[] {
  const rows: XeroEvent[] = []

  for (const inv of invoices) {
    const caseId = inv.InvoiceID
    const invoiceNumber = inv.InvoiceNumber ?? caseId.slice(0, 8)
    const contactName = inv.Contact?.Name ?? 'Unknown'
    const amountDue = inv.Total ?? 0
    const currency = inv.CurrencyCode ?? 'GBP'

    const history = histories[caseId] ?? []
    const historyActivities = history.map(r => mapActivity(r.Changes))

    // Synthetic creation event only when history has no creation record
    if (!historyActivities.includes('Invoice Created')) {
      const createdAt = parseXeroDate(inv.DateString ?? inv.Date)
      if (createdAt) {
        rows.push({ caseId, invoiceNumber, contactName, activity: 'Invoice Created',
          timestamp: createdAt.toISOString(), user: 'system', amountDue, currency })
      }
    }

    for (const record of history) {
      const ts = parseXeroDate(record.DateUTCString ?? record.DateUTC)
      if (!ts) continue
      rows.push({
        caseId, invoiceNumber, contactName,
        activity: mapActivity(record.Changes),
        timestamp: ts.toISOString(),
        user: record.User ?? 'unknown',
        amountDue, currency,
      })
    }
  }

  return rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function summariseEvents(events: XeroEvent[]) {
  const cases = new Map<string, XeroEvent[]>()
  for (const e of events) {
    const arr = cases.get(e.caseId) ?? []
    arr.push(e)
    cases.set(e.caseId, arr)
  }

  const activityCounts: Record<string, number> = {}
  for (const e of events) {
    activityCounts[e.activity] = (activityCounts[e.activity] ?? 0) + 1
  }

  const endStates: Record<string, number> = {}
  const durations: number[] = []

  for (const evts of cases.values()) {
    const sorted = evts.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    const last = sorted[sorted.length - 1].activity
    endStates[last] = (endStates[last] ?? 0) + 1
    const duration = (new Date(sorted[sorted.length - 1].timestamp).getTime()
      - new Date(sorted[0].timestamp).getTime()) / 86_400_000
    durations.push(duration)
  }

  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
  const max = durations.length ? Math.max(...durations) : 0

  // Unique invoice values
  const seenCases = new Set<string>()
  let totalValue = 0
  for (const e of events) {
    if (!seenCases.has(e.caseId)) {
      totalValue += e.amountDue
      seenCases.add(e.caseId)
    }
  }

  return {
    totalInvoices: cases.size,
    totalEvents: events.length,
    activityCounts,
    endStates,
    avgCycleDays: +avg.toFixed(1),
    maxCycleDays: +max.toFixed(1),
    totalValue: +totalValue.toFixed(2),
    currency: events[0]?.currency ?? 'GBP',
  }
}
