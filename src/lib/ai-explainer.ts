import Anthropic from '@anthropic-ai/sdk'
import type { ProcessMiningResult, EventSummary } from './types'

export async function generateInsights(
  pm: ProcessMiningResult,
  summary: EventSummary,
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const sym = summary.currency === 'GBP' ? '£' : summary.currency

  const prompt = `You are a senior finance process analyst reviewing an Order-to-Cash (O2C) process for an SMB accounting firm client. You have been given the output of a process mining analysis on their Xero invoice data.

Write a brief, actionable findings report — the kind an accountant reads on Monday morning and immediately knows what to do. Be specific with numbers. Flag financial risk in ${sym}. Avoid jargon. Use bullet points. Keep it under 400 words.

## Invoice Portfolio Summary
- Total invoices analysed: ${summary.totalInvoices}
- Total portfolio value: ${sym}${summary.totalValue.toLocaleString()}
- Average cycle time: ${summary.avgCycleDays} days
- Activity breakdown: ${JSON.stringify(summary.activityCounts, null, 2)}
- Terminal states: ${JSON.stringify(summary.endStates, null, 2)}

## Process Mining Findings
- Total distinct variants: ${Object.keys(pm.variants).length}
- Happy path: ${pm.happyPath.join(' → ')}
- Variant distribution: ${JSON.stringify(Object.fromEntries(Object.entries(pm.variants).slice(0, 6)), null, 2)}
- Cycle times: mean ${pm.cycleTimes.mean} days, max ${pm.cycleTimes.max} days
- Rework rate: ${(pm.reworkRate * 100).toFixed(1)}%
- Bottlenecks: ${JSON.stringify(pm.bottlenecks.slice(0, 5), null, 2)}

Write the report now. Structure it as:
**1. Key Findings**
(3-5 bullets, most impactful first)

**2. Financial Risk**
(what ${sym} value is at risk and why)

**3. Recommended Actions**
1. [action]
2. [action]
3. [action]`

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  return (message.content[0] as { type: string; text: string }).text
}
