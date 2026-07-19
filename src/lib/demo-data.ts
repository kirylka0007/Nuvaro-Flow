import type { AnalysisResult, XeroEvent } from './types'

/**
 * Deterministic sample analysis used by demo mode (`/?demo=1`).
 *
 * Lets the dashboard be shown — and deployed publicly — without a live Xero
 * connection. All figures are synthetic but internally consistent: the events
 * below produce exactly the summary, variants and end states declared here.
 */

type Path = 'approved' | 'created-only' | 'out-of-order' | 'voided'

interface InvoiceSpec {
  num: string
  contact: string
  amount: number
  date: string
  path: Path
}

const INVOICES: InvoiceSpec[] = [
  // 12 clean: Created -> Approved (£25,700)
  { num: 'INV-0001', contact: 'Harbour Design Studio',  amount: 3200, date: '2025-02-11', path: 'approved' },
  { num: 'INV-0002', contact: 'Northgate Legal',        amount: 1450, date: '2025-03-04', path: 'approved' },
  { num: 'INV-0003', contact: 'Pike & Rowe Ltd',        amount: 2750, date: '2025-04-18', path: 'approved' },
  { num: 'INV-0004', contact: 'Brightside Marketing',   amount: 1900, date: '2025-05-22', path: 'approved' },
  { num: 'INV-0005', contact: 'Calder Construction',    amount: 2400, date: '2025-06-09', path: 'approved' },
  { num: 'INV-0006', contact: 'Ashby Consulting',       amount: 1750, date: '2025-07-15', path: 'approved' },
  { num: 'INV-0008', contact: 'Meridian Software',      amount: 2950, date: '2025-09-02', path: 'approved' },
  { num: 'INV-0010', contact: 'Fenwick Interiors',      amount: 1600, date: '2025-10-27', path: 'approved' },
  { num: 'INV-0011', contact: 'Orchard Foods',          amount: 2250, date: '2025-11-13', path: 'approved' },
  { num: 'INV-0013', contact: 'Waverley Print Co',      amount: 1850, date: '2026-01-08', path: 'approved' },
  { num: 'INV-0016', contact: 'Dunmore Logistics',      amount: 2100, date: '2026-03-19', path: 'approved' },
  { num: 'INV-0017', contact: 'Kestrel Analytics',      amount: 1500, date: '2026-04-24', path: 'approved' },

  // 4 end at Created — the £8,567 stuck in limbo
  { num: 'INV-0007', contact: 'Selby Architects',       amount: 2142, date: '2025-08-06', path: 'out-of-order' },
  { num: 'INV-0012', contact: 'Redhill Property',       amount: 1850, date: '2025-12-01', path: 'created-only' },
  { num: 'INV-0015', contact: 'Tavistock Media',        amount: 2475, date: '2026-02-16', path: 'created-only' },
  { num: 'INV-0018', contact: 'Linden Care Group',      amount: 2100, date: '2026-05-07', path: 'created-only' },

  // 2 voided — the £4,283
  { num: 'INV-0009', contact: 'Grangemouth Supplies',   amount: 1995, date: '2025-10-03', path: 'voided' },
  { num: 'INV-0014', contact: 'Blackwood Engineering',  amount: 2288, date: '2026-01-29', path: 'voided' },
]

const USERS = ['Sarah Nolan', 'James Whitfield', 'Priya Raman']

function at(date: string, hour: number): string {
  return `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`
}

function buildEvents(): XeroEvent[] {
  const events: XeroEvent[] = []

  INVOICES.forEach((inv, i) => {
    const base = {
      caseId: inv.num,
      invoiceNumber: inv.num,
      contactName: inv.contact,
      user: USERS[i % USERS.length],
      amountDue: inv.amount,
      currency: 'GBP',
    }

    // Same-day timestamps throughout — this is what makes every cycle time 0,
    // which the "cycle times all show zero" finding calls out.
    switch (inv.path) {
      case 'approved':
        events.push({ ...base, activity: 'Invoice Created',  timestamp: at(inv.date, 9) })
        events.push({ ...base, activity: 'Invoice Approved', timestamp: at(inv.date, 14) })
        break
      case 'created-only':
        events.push({ ...base, activity: 'Invoice Created',  timestamp: at(inv.date, 9) })
        break
      case 'out-of-order':
        // Approval stamped before creation — the audit-trail anomaly
        events.push({ ...base, activity: 'Invoice Approved', timestamp: at(inv.date, 9) })
        events.push({ ...base, activity: 'Invoice Created',  timestamp: at(inv.date, 15) })
        break
      case 'voided':
        events.push({ ...base, activity: 'Invoice Created',  timestamp: at(inv.date, 9) })
        events.push({ ...base, activity: 'Invoice Voided',   timestamp: at(inv.date, 16) })
        break
    }
  })

  return events
}

const events = buildEvents()

export const DEMO_ANALYSIS: AnalysisResult = {
  events,

  summary: {
    totalInvoices: 18,
    totalEvents: events.length,          // 33
    activityCounts: {
      'Invoice Created': 18,
      'Invoice Approved': 13,
      'Invoice Voided': 2,
    },
    endStates: {
      'Invoice Approved': 12,
      'Invoice Created': 4,
      'Invoice Voided': 2,
    },
    avgCycleDays: 0,
    maxCycleDays: 0,
    totalValue: 38550,
    currency: 'GBP',
  },

  processMining: {
    variants: {
      'Invoice Created → Invoice Approved': 12,
      'Invoice Created': 3,
      'Invoice Created → Invoice Voided': 2,
      'Invoice Approved → Invoice Created': 1,
    },
    happyPath: ['Invoice Created', 'Invoice Approved'],
    cycleTimes: { mean: 0, median: 0, min: 0, max: 0 },
    endStates: {
      'Invoice Approved': 12,
      'Invoice Created': 4,
      'Invoice Voided': 2,
    },
    bottlenecks: [],
    reworkRate: 0.056,
  },

  aiInsights: {
    headline:
      'Two thirds of invoices move cleanly from raised to approved, but £8,567 is sitting unissued and nothing in the data shows an invoice ever being sent or paid.',
    recommendations: [
      {
        id: 'stuck-at-created',
        title: 'Invoices raised but never approved',
        severity: 'critical',
        category: 'cash-collection',
        finding: '4 of 18 invoices (22%) stop at Created and were never approved.',
        impact:
          'That is £8,567 you have decided to charge for but have not issued — no customer has been asked to pay it, so it cannot land in your bank.',
        valueAtRisk: 8567,
        action:
          'Pull the 4 unapproved invoices today, approve and send the genuine ones, and void or correct the rest by end of week.',
        evidence: [
          '4 invoices end at the Created state',
          'Combined value £8,567 of a £38,550 book',
          'No approval event recorded against any of them',
        ],
        relatedActivities: ['Invoice Created'],
      },
      {
        id: 'no-send-or-payment-events',
        title: 'No evidence invoices are ever sent or paid',
        severity: 'warning',
        category: 'cash-collection',
        finding:
          'The event log contains only Created, Approved and Voided. There is no Sent, Paid or Payment Allocated activity anywhere.',
        impact:
          'You cannot tell how long customers take to pay, or whether an invoice was chased. The entire cash-collection half of the process is invisible.',
        valueAtRisk: null,
        action:
          'Send invoices through Xero rather than outside it, so sending and payment are recorded and collection time becomes measurable.',
        evidence: [
          'Activity breakdown contains 3 activity types only',
          'No terminal state represents a paid invoice',
        ],
        relatedActivities: ['Invoice Approved'],
      },
      {
        id: 'voided-after-approval',
        title: 'Approved invoices later voided',
        severity: 'warning',
        category: 'billing-accuracy',
        finding: '2 invoices were voided (an 11% void rate), one of them after it had been approved.',
        impact:
          'Voiding work you already approved usually means a customer was billed wrong — it costs you rework and chips away at trust.',
        valueAtRisk: 4283,
        action:
          'Review both voids for root cause (wrong amount, duplicate, dispute) and require a reason code on every void from now on.',
        evidence: ['2 of 18 invoices voided', 'Combined value £4,283'],
        relatedActivities: ['Invoice Voided'],
      },
      {
        id: 'cycle-times-zero',
        title: 'Every invoice shows a zero-day cycle time',
        severity: 'warning',
        category: 'efficiency',
        finding: 'Mean and maximum cycle time both compute to 0 days across all 18 invoices.',
        impact:
          'Without real timing you cannot see how long approval takes or where work stalls, so genuine delays stay hidden.',
        valueAtRisk: null,
        action:
          'Confirm Xero is exporting full date-time stamps per event, then re-run so cycle-time figures mean something.',
        evidence: ['All events for a given invoice fall on the same date', 'No positive wait time on any activity'],
        relatedActivities: [],
      },
      {
        id: 'approval-before-creation',
        title: 'Approval recorded before the invoice existed',
        severity: 'warning',
        category: 'controls',
        finding: 'One invoice shows an Approved event timestamped before its Created event.',
        impact:
          'An out-of-order trail means someone can approve work that was not properly raised — and it undermines the records you would rely on in a dispute or audit.',
        valueAtRisk: 2142,
        action:
          "Check that invoice's audit log in Xero, correct the entry, and review who holds approval rights.",
        evidence: ['1 invoice follows Approved → Created', 'Value £2,142'],
        relatedActivities: ['Invoice Approved', 'Invoice Created'],
      },
      {
        id: 'core-flow-healthy',
        title: 'The core approval route is clean',
        severity: 'healthy',
        category: 'controls',
        finding: '12 of 18 invoices (67%) follow the straight Created → Approved path with almost no rework.',
        impact:
          'Your everyday process works. The problems above are a small set of exceptions, not a broken system.',
        valueAtRisk: null,
        action:
          'Leave the main workflow alone and put your effort into the 6 exception invoices.',
        evidence: ['Dominant variant covers 12 invoices', 'Rework rate 5.6%'],
        relatedActivities: ['Invoice Created', 'Invoice Approved'],
      },
    ],
  },

  analysedAt: '2026-06-21T21:08:00.000Z',
}

/**
 * Canned chat replies for demo mode.
 *
 * The public demo runs with no ANTHROPIC_API_KEY, so the chat never calls the
 * API — it replays these instead. Keyed by recommendation id, with a fallback
 * for free-text questions.
 */
export const DEMO_CHAT_REPLIES: Record<string, string> = {
  'stuck-at-created':
    'Four invoices are sitting at Created and were never approved: INV-0007 (£2,142), INV-0012 (£1,850), INV-0015 (£2,475) and INV-0018 (£2,100) — £8,567 in total, about 22% of your book.\n\nWhat the data shows: each of these has a Created event and nothing after it. No approval, no void. They are not mistakes that were cancelled — they were simply left.\n\nWhy it matters: an unapproved invoice in Xero has not been issued. The customer has never been asked to pay, so none of that £8,567 can arrive. It is also probably sitting in your expected revenue, which makes your forecast look healthier than it is.\n\nWhat I would do this week:\n1. Open the four and decide: genuine, duplicate, or draft raised in error.\n2. Approve and send the genuine ones today — that is the fastest cash in this whole analysis.\n3. Void the rest so they stop inflating your numbers.\n4. Give one person a weekly job of clearing the Created queue, so it never builds up again.',

  'no-send-or-payment-events':
    'Your event log only ever contains three activities: Created, Approved and Voided. There is no Sent, Paid or Payment Allocated event anywhere across all 18 invoices.\n\nWhat that means in practice: the analysis can see an invoice being raised and approved, then it goes dark. I cannot tell you how long customers take to pay, which invoices are overdue, or whether anyone chased them — because none of that is being recorded.\n\nThe most likely cause is that invoices are approved in Xero but then sent some other way (attached to an email, exported to PDF), and payments are reconciled in bulk rather than allocated against the invoice.\n\nWhat to change: send invoices through Xero itself, and allocate payments against them when they land. Do that for one month and this dashboard can start answering the question you actually care about — how many days it takes to get paid, and who is slowest.',

  'voided-after-approval':
    'Two invoices were voided out of 18, which is an 11% void rate. For a clean process you would expect low single digits.\n\nThe two are INV-0009 (£1,995) and INV-0014 (£2,288) — £4,283 combined. The important detail is that one was voided after it had already been approved, which means it passed your checks and was still wrong.\n\nThat pattern usually points to one of three things: the amount was wrong, it duplicated another invoice, or the customer disputed it after the fact.\n\nWhat I would do: look at those two specifically and find out which of the three it was. Then require a reason code on every void going forward. It costs nothing, and it turns "we void things sometimes" into data you can act on — after a couple of months you will see whether it is a pricing problem, a data-entry problem, or a customer problem.',

  'cycle-times-zero':
    'Every invoice in this dataset shows a cycle time of 0 days — mean and maximum both zero. That is not a real result.\n\nWhat is happening: for each invoice, every event carries the same date. So when the analysis subtracts the created timestamp from the approved timestamp, it gets zero every time. Either Xero is exporting dates without times, or all activity genuinely happens within the same day and the resolution is too coarse to see it.\n\nWhy you should care: cycle time is the measure that tells you where work stalls. Without it, the bottleneck chart has nothing to show, and a delay in approval is invisible until someone notices the cash has not arrived.\n\nFix: confirm the event export includes full date-times, not just dates. Once real timestamps flow through, re-run the analysis and the bottleneck view becomes the most useful screen here.',

  'approval-before-creation':
    'One invoice — INV-0007, £2,142 — has an Approved event timestamped before its Created event. In a normal Xero workflow that sequence cannot happen.\n\nThere are two plausible explanations. The mundane one is a data-entry or timestamp error: the invoice was backdated, or entered retrospectively after the work was approved verbally. The one worth ruling out is that someone has permissions letting them approve outside the normal flow.\n\nEither way it matters because your audit trail is the thing you fall back on in a dispute, and right now it contains a sequence that is not possible. Worth noting this is the same invoice sitting unapproved in the Getting Paid section, so it deserves attention regardless.\n\nWhat to do: open that invoice\'s history in Xero, see who touched it and when, correct the record, and check who currently holds approval rights.',

  'core-flow-healthy':
    'Twelve of your 18 invoices — 67% — follow the straight Created to Approved path with a rework rate of just 5.6%. That is a genuinely clean core process.\n\nThis matters for how you read everything else on this page. The problems flagged above are not symptoms of a broken system; they are a small set of exceptions sitting around a workflow that works. Six invoices need attention, not eighteen.\n\nSo my advice is the opposite of a redesign: leave the main approval flow alone. Put your effort into clearing the four stuck invoices and understanding the two voids. If you fix those six and start recording when invoices are sent and paid, this process would look strong.',
}

export const DEMO_CHAT_FALLBACK =
  'This is a demo running on sample data, so live AI chat is switched off here — the replies you see are pre-written.\n\nIn the full version this is a real conversation with Claude, grounded in your actual Xero analysis: it can only cite figures that appear in your data, and it will tell you when the data cannot answer a question rather than guessing.\n\nTry the "Dig deeper" button on any recommendation card to see a worked example.'
