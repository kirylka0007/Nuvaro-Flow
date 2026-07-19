import Anthropic from '@anthropic-ai/sdk'
import type { ProcessMiningResult, EventSummary, AiInsights } from './types'

const TOOL_NAME = 'emit_insights'

const insightsTool: Anthropic.Tool = {
  name: TOOL_NAME,
  description: 'Emit structured process intelligence insights for the dashboard.',
  input_schema: {
    type: 'object' as const,
    properties: {
      headline: {
        type: 'string',
        description: 'One-sentence executive summary of the overall O2C process health.',
      },
      recommendations: {
        type: 'array',
        description: 'Ranked list of recommendations, most impactful first.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Stable kebab-case slug, e.g. "stuck-at-created".' },
            title: { type: 'string', description: 'Short headline (max 8 words).' },
            severity: {
              type: 'string',
              enum: ['critical', 'warning', 'opportunity', 'healthy'],
              description: 'critical = immediate action needed; warning = monitor closely; opportunity = improvement available; healthy = performing well.',
            },
            category: {
              type: 'string',
              enum: ['cash-collection', 'billing-accuracy', 'controls', 'efficiency'],
              description: 'Business outcome this affects: cash-collection = getting invoices issued, sent and paid; billing-accuracy = correct invoices, voids, disputes, customer trust; controls = approvals, audit trail, data quality, compliance; efficiency = cycle time, bottlenecks, rework.',
            },
            finding: { type: 'string', description: 'What the data shows — be specific with numbers.' },
            impact: { type: 'string', description: 'Plain-English business consequence.' },
            valueAtRisk: {
              type: ['number', 'null'],
              description: 'GBP amount at risk if quantifiable from the data, otherwise null.',
            },
            action: { type: 'string', description: 'Concrete next step the business should take.' },
            evidence: {
              type: 'array',
              items: { type: 'string' },
              description: '1–3 specific facts drawn from the provided mining data.',
            },
            relatedActivities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Activity names from the process data this recommendation relates to.',
            },
          },
          required: ['id', 'title', 'severity', 'category', 'finding', 'impact', 'valueAtRisk', 'action', 'evidence'],
        },
      },
    },
    required: ['headline', 'recommendations'],
  },
}

export async function generateInsights(
  pm: ProcessMiningResult,
  summary: EventSummary,
  businessContext?: string,
): Promise<AiInsights> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const sym = summary.currency === 'GBP' ? '£' : summary.currency

  const contextBlock = businessContext?.trim()
    ? `\n## What the owner told us about their business\n"${businessContext.trim()}"\n\nTailor your recommendations and wording to this. If a finding matters more or less given their situation, say so and re-rank accordingly.\n`
    : ''

  const prompt = `You are advising the owner of a small business on their invoicing and cash-collection process. You are NOT writing for an auditor or a data analyst — you are writing for a busy owner who cares about getting paid, keeping customers happy, and not wasting time.

You have the output of a process mining analysis of their Xero invoice data. Turn it into recommendations a small-business owner immediately understands and cares about.

Rules:
- Lead with the business consequence: cash they're owed but haven't collected, invoices issued late or not at all, customers billed wrong, time wasted on rework.
- When something is technically a "data quality" or "controls" issue, explain why the OWNER should care (e.g. "you can't tell how long you wait to get paid"), not just that the data is messy.
- Be specific with numbers and flag money at risk in ${sym}.
- Assign each recommendation a category (cash-collection, billing-accuracy, controls, efficiency).
- Rank by business impact, most impactful first. Set severity honestly.
${contextBlock}
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

Produce 3 to 5 recommendations. Call the emit_insights tool with your analysis now.`

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    system:
      'You are a trusted advisor to a small-business owner, fluent in plain English and focused on cash flow, customers and time. Always respond by calling the emit_insights tool with complete, valid structured data. Keep each text field concise (one to two sentences) so the full tool call fits comfortably within the token budget.',
    tools: [insightsTool],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [{ role: 'user', content: prompt }],
  })

  const toolBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolBlock) {
    console.error('[ai-explainer] No tool_use block. stop_reason:', message.stop_reason)
    throw new Error('AI did not return structured insights (no tool call).')
  }

  if (message.stop_reason === 'max_tokens') {
    console.error('[ai-explainer] Response truncated at max_tokens — tool output likely incomplete.')
  }

  const insights = toolBlock.input as Partial<AiInsights>

  if (!insights || !Array.isArray(insights.recommendations) || insights.recommendations.length === 0) {
    console.error('[ai-explainer] Malformed insights. stop_reason:', message.stop_reason,
      'input keys:', insights ? Object.keys(insights) : 'null')
    throw new Error(
      message.stop_reason === 'max_tokens'
        ? 'AI response was cut off before recommendations were complete.'
        : 'AI returned no recommendations.',
    )
  }

  return {
    headline: insights.headline ?? '',
    recommendations: insights.recommendations,
  }
}
