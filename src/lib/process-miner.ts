import type { XeroEvent, ProcessMiningResult } from './types'

export function runAnalysis(events: XeroEvent[]): ProcessMiningResult {
  // Group and sort events per case
  const cases = new Map<string, XeroEvent[]>()
  for (const e of events) {
    const arr = cases.get(e.caseId) ?? []
    arr.push(e)
    cases.set(e.caseId, arr)
  }
  for (const [id, evts] of cases) {
    cases.set(id, evts.sort((a, b) => a.timestamp.localeCompare(b.timestamp)))
  }

  // Variants
  const variantCounts: Record<string, number> = {}
  const endStates: Record<string, number> = {}
  const durations: number[] = []
  let reworkCount = 0

  for (const evts of cases.values()) {
    const activities = evts.map(e => e.activity)
    const seq = activities.join(' → ')
    variantCounts[seq] = (variantCounts[seq] ?? 0) + 1

    const last = activities[activities.length - 1]
    endStates[last] = (endStates[last] ?? 0) + 1

    const duration = (new Date(evts[evts.length - 1].timestamp).getTime()
      - new Date(evts[0].timestamp).getTime()) / 86_400_000
    durations.push(duration)

    if (new Set(activities).size < activities.length) reworkCount++
  }

  const variants = Object.fromEntries(
    Object.entries(variantCounts).sort(([, a], [, b]) => b - a),
  )
  const happyPath = Object.keys(variants)[0]?.split(' → ') ?? []

  // Cycle times
  const sorted = [...durations].sort((a, b) => a - b)
  const mean = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0

  // Bottlenecks: average wait before each activity across all cases
  const waitMap = new Map<string, number[]>()
  for (const evts of cases.values()) {
    for (let i = 1; i < evts.length; i++) {
      const wait = (new Date(evts[i].timestamp).getTime()
        - new Date(evts[i - 1].timestamp).getTime()) / 86_400_000
      const act = evts[i].activity
      const arr = waitMap.get(act) ?? []
      arr.push(wait)
      waitMap.set(act, arr)
    }
  }
  const bottlenecks = [...waitMap.entries()]
    .map(([activity, waits]) => ({
      activity,
      avgWaitDays: +(waits.reduce((a, b) => a + b, 0) / waits.length).toFixed(2),
    }))
    .filter(b => b.avgWaitDays > 0)
    .sort((a, b) => b.avgWaitDays - a.avgWaitDays)
    .slice(0, 8)

  return {
    variants,
    happyPath,
    cycleTimes: {
      mean: +mean.toFixed(1),
      median: +median.toFixed(1),
      min: +(sorted[0] ?? 0).toFixed(1),
      max: +(sorted[sorted.length - 1] ?? 0).toFixed(1),
    },
    endStates,
    bottlenecks,
    reworkRate: cases.size ? reworkCount / cases.size : 0,
  }
}
