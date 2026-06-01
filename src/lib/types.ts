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

export interface AnalysisResult {
  events: XeroEvent[]
  summary: EventSummary
  processMining: ProcessMiningResult
  aiReport: string
  analysedAt: string
}
