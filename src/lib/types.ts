export interface XeroEvent {
  caseId: string
  invoiceNumber: string
  contactName: string
  activity: string
  timestamp: string
  user: string
  amountDue: number
  currency: string
}

export interface CycleTimes {
  mean: number
  median: number
  min: number
  max: number
}

export interface Bottleneck {
  activity: string
  avgWaitDays: number
}

export interface ProcessMiningResult {
  variants: Record<string, number>
  happyPath: string[]
  cycleTimes: CycleTimes
  endStates: Record<string, number>
  bottlenecks: Bottleneck[]
  reworkRate: number
}

export interface EventSummary {
  totalInvoices: number
  totalEvents: number
  activityCounts: Record<string, number>
  endStates: Record<string, number>
  avgCycleDays: number
  maxCycleDays: number
  totalValue: number
  currency: string
}

export type Severity = 'critical' | 'warning' | 'opportunity' | 'healthy'

export type RecommendationCategory =
  | 'cash-collection'
  | 'billing-accuracy'
  | 'controls'
  | 'efficiency'

export interface Recommendation {
  id: string
  title: string
  severity: Severity
  category: RecommendationCategory
  finding: string
  impact: string
  valueAtRisk: number | null
  action: string
  evidence: string[]
  relatedActivities?: string[]
}

export interface AiInsights {
  headline: string
  recommendations: Recommendation[]
}

export interface AnalysisResult {
  events: XeroEvent[]
  summary: EventSummary
  processMining: ProcessMiningResult
  aiInsights: AiInsights
  insightsError?: string  // set when AI insight generation failed (charts still valid)
  aiReport?: string  // TODO: retire after RecommendationsHero is validated
  analysedAt: string
}
