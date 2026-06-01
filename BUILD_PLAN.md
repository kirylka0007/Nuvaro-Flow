# Nuvaro Flow — Web App Build Plan (v2)

## Stack
- **Next.js 15** (App Router, TypeScript, Tailwind) — hosted on Vercel
- **Recharts** — bar, donut, horizontal bar charts
- **iron-session** — encrypted HTTP-only cookie for Xero tokens
- **Anthropic SDK (JS)** — Claude API call server-side
- **lucide-react** — icons
- No PM4Py — process mining logic rewritten in TypeScript

---

## Architecture

```
/api/auth/xero        → redirects to Xero OAuth login page
/api/auth/callback    → receives code, swaps for tokens, stores in cookie, → /
/api/analyse          → full pipeline in one call:
                         1. refresh Xero token if needed
                         2. fetch all invoices + history (parallel batches)
                         3. build event log (TS port of event_log_builder.py)
                         4. run process mining (TS port of process_miner.py)
                         5. call Claude API
                         6. return JSON to frontend
/api/disconnect       → clears cookie
```

---

## Pages

| Page       | Purpose                                                                |
|------------|------------------------------------------------------------------------|
| `/`        | Dashboard — loads saved JSON from last run, shows charts + AI panel   |
| `/connect` | Landing shown when not authenticated — "Connect Xero" button          |

---

## Colour Tokens

```
Background:          #080F1E
Sidebar bg:          #060D1A
Card bg:             #0D1B2E
Card border:         rgba(30,127,216,0.2)
Brand blue:          #1E7FD8
Brand cyan:          #00D4FF
Metric value:        #00D4FF   ← all KPI numbers in cyan
Text primary:        #f1f5f9
Text secondary:      #94a3b8
Text muted:          #64748b
Risk red:            #ef4444
Risk amber:          #f59e0b
Risk green:          #22c55e
Chart purple:        #a855f7   ← used in Activity Mix donut
Chart pink:          #ec4899   ← used in Activity Mix donut
Active nav accent:   #00D4FF
Divider:             rgba(30,127,216,0.15)
```

---

## Typography System

```
Font family: Inter (next/font/google)

Sizes:
  11px — caption, axis tick labels, table small text
  12px — body text, card descriptions, muted info
  13px — standard labels, nav items, badge text
  16px — section titles (e.g. "AI Insights")
  20px — page title ("Process Intelligence Overview")
  24px — KPI metric values

Weights: 400 regular | 500 medium | 600 semibold | 700 bold
Line-height: 1.4 (headings) | 1.5 (body) | 1.6 (descriptions)
```

---

## Spacing Grid (8px base)

```
Page padding:       24px
Section gap:        24px (between KPI row and charts)
Card padding:       16px
Chart grid gap:     12px (between 4 charts)
Column gap:         16px (between left charts and right AI panel)
Button padding:     8px 16px
Nav item padding:   10px 12px
```

---

## Layout

### Overall Page Structure
```
[Sidebar 80px fixed] | [Main content, fluid]
                          [Header 50px]
                          [KPI row]
                          [24px gap]
                          [Charts 65% | AI panel 35%]
                          [Event log, collapsible]
```

### Sidebar (fixed, width: 80px)
- Background: #060D1A
- Right border: 1px solid rgba(30,127,216,0.15)
- Structure top-to-bottom:
  - Logo: ⚡ icon centred, 40×40px, 20px top padding
  - Nav items (icon only, tooltip on hover):
    - Overview / Dashboard (LayoutDashboard icon) — default active
    - Process Mining (GitBranch icon)
    - Variants (Layers icon)
    - AI Insights (Sparkles icon)
    - Reports (FileText icon)
    - Alerts (Bell icon)
  - Spacer (flex-1)
  - Bottom: Settings (Settings icon) + connection status dot
- Nav item styles:
  - Size: 44×44px, centred in sidebar
  - Icon size: 20px
  - Default: colour #64748b, background transparent
  - Hover: background rgba(30,127,216,0.1), colour #94a3b8
  - Active: background rgba(30,127,216,0.18), colour #00D4FF,
            left border 2px solid #00D4FF
- Connection status dot (bottom, centred):
  - 8px circle
  - Connected: #22c55e with subtle pulse animation
  - Disconnected: #ef4444

### Header (height: 50px, below page top padding)
- Left side:
  - "Process Intelligence Overview" — 20px, weight 600, #f1f5f9
  - Below title: date range controls
    - Two preset buttons: "1 Jan 2025 – 1 Jun 2026" | text only, #64748b, 12px
    - Filter icon button (SlidersHorizontal, 16px, #64748b)
    - Note: date range is display-only for PoC (no filtering logic needed)
- Right side (flex, gap 12px, align-items: center):
  - "Last updated at HH:MM" — 12px, #64748b
  - "↻ Refresh" button — #1E7FD8 bg, white text, 13px, 8px 16px padding,
    rounded-md, onClick: POST /api/analyse

### KPI Cards Row (5 cards, gap: 12px, margin-top: 20px)
- Card dimensions: ~160px min-width, fluid, ~100px tall
- Background: #0D1B2E
- Border: 1px solid rgba(30,127,216,0.2)
- Border-bottom: 2px solid #1E7FD8 (accent)
- Border-radius: 10px
- Padding: 16px
- Content layout:
  - Label: 11px uppercase, letter-spacing 0.06em, #64748b
  - Value: 24px, weight 700, #00D4FF (cyan)
  - Delta row: 12px, with icon arrow
    - Positive delta (bad, e.g. more off-path): red #ef4444 + ↑ arrow
    - Negative delta (good): green #22c55e + ↓ arrow
    - Neutral: #64748b

Cards (in order):
  1. "TOTAL INVOICES" / value: count / delta: none
  2. "PORTFOLIO VALUE" / value: £XX,XXX / delta: none
  3. "AVG CYCLE TIME" / value: X.X days / delta: none
  4. "OFF HAPPY PATH" / value: XX% / delta: "N invoices" in red if >0
  5. "PROCESS VARIANTS" / value: N / delta: "Rework X%" in amber if >0

### Two-Column Main Content (margin-top: 24px)
- Left column: 65% width
- Right column: 35% width
- Gap: 16px

---

## Charts (Left Column, 2×2 grid, gap: 12px)

All charts share:
- Background: #0D1B2E
- Border: 1px solid rgba(30,127,216,0.2)
- Border-radius: 10px
- Padding: 16px
- Height: 280px
- Title: 13px, weight 600, #f1f5f9, margin-bottom 12px
- Axis tick colour: #64748b, font 11px
- Grid lines: stroke rgba(30,127,216,0.1)
- Tooltip: bg #0D1B2E, border 1px solid #1E7FD8, text #f1f5f9

### Chart 1 — Bottlenecks (Top-Left)
- Type: Recharts BarChart, layout="vertical"
- Title: "Bottlenecks — Avg Wait (days)"
- Data: [{ activity: string, avgWaitDays: number }] — only rows where avgWaitDays > 0
- X-axis: numeric, label "days", domain [0, auto]
- Y-axis: activity names, width 140px
- Bar: fill="#1E7FD8", radius [0,4,4,0], barSize 14
- If no positive data: centred grey placeholder "No bottleneck data yet —
  cycle times will show with real client data"

### Chart 2 — Activity Mix (Top-Right)
- Type: Recharts PieChart, innerRadius 55, outerRadius 90
- Title: "Activity Mix"
- Data: activity_counts from summary
- Colours (in order): #1E7FD8, #00D4FF, #38bdf8, #ef4444, #f59e0b, #a855f7
- No label on slices
- Legend: below chart, orientation horizontal, iconType "circle", iconSize 8,
          formatter: "(name) XX%" in 11px #94a3b8

### Chart 3 — Invoice End States (Bottom-Left)
- Type: Recharts BarChart, layout="vertical"
- Title: "Invoice End States"
- Data: [{ state: string, count: number }] sorted by count desc
- X-axis: numeric, label "invoices"
- Y-axis: state names, width 160px
- Bar colour map:
    "Payment Received"       → #00D4FF
    "Invoice Approved"       → #1E7FD8
    "Invoice Created"        → #64748b
    "Invoice Voided"         → #ef4444
    "Invoice Edited"         → #f59e0b
    "Invoice Sent to Customer" → #38bdf8
- Each bar uses its mapped colour (use Cell component)
- barSize 14, radius [0,4,4,0]

### Chart 4 — Process Variants (Bottom-Right)
- Type: HTML table, Tailwind styled
- Title: "Process Variants"
- Columns: Variant (flex) | Count (80px) | Share (70px)
- Header: 11px uppercase, #64748b, border-bottom 1px solid rgba(30,127,216,0.2)
- Rows: 12px, #94a3b8, border-bottom 1px solid rgba(30,127,216,0.08)
- Hover row: bg rgba(30,127,216,0.06)
- First row (happy path): text colour #f1f5f9, weight 500
- Scrollable: overflow-y auto, max-height 220px
- Share: shown as "67%" in #64748b

---

## AI Insights Panel (Right Column, 35%)

- Background: #0D1B2E
- Border: 1px solid rgba(30,127,216,0.25)
- Border-left: 3px solid #1E7FD8
- Border-radius: 10px
- Padding: 16px
- Full height (matches left column)
- Overflow-y: auto

Structure:
- Header row:
  - "✨ AI Insights" — 14px, weight 700, #f1f5f9
  - "Regenerate" button (right-aligned) — text only, 12px, #1E7FD8, no bg border
    hover: #00D4FF
  - Divider below header
- Content: parsed from Claude API plain-text report
  Each section rendered as:
  - Section heading: 10px uppercase, letter-spacing 0.08em, #00D4FF, margin-top 12px
  - Bullet points: each rendered as an insight row:
    - Left accent bar: 3px wide, full height, colour by risk level:
        Risk/stuck/void/overdue keywords → #ef4444 (red)
        Watch/review/delay/rework → #f59e0b (amber)
        Positive/complete → #22c55e (green)
    - Text: 12px, #94a3b8, line-height 1.6
    - £ amounts highlighted: #00D4FF, weight 600
  - Numbered actions: "1." in #1E7FD8, then action text
  - Divider between sections: 1px solid rgba(30,127,216,0.12)
- Empty state: centred ✨ icon + "Click Regenerate to generate AI insights"
  in 13px, #475569

---

## Collapsible Event Log (Bottom, below charts)

- Collapsed height: 44px, shows "📋 Raw Event Log  ▼  35 events"
- Expanded: up to 400px, scrollable
- Background: #0D1B2E, border 1px solid rgba(30,127,216,0.2), border-radius 10px
- Default: collapsed
- Toggle: click anywhere on header row
- Table columns: Invoice | Contact | Activity | Timestamp | User | Amount (£)
- Font: 11px, #94a3b8
- Row border: 1px solid rgba(30,127,216,0.08)
- Header: 11px uppercase, #64748b
- Filter bar (visible when expanded):
  - Two multiselects: Activity filter + Contact filter
  - Show count: "X of Y events" in 11px #64748b

---

## Interactive States

### Loading (during /api/analyse call)
- Refresh button: spinner icon + "Analysing…" text, disabled, opacity 0.7
- KPI cards: pulse skeleton (bg #0D1B2E animated bg-shine)
- Charts: replaced by centred spinner
- AI panel: "Fetching insights…" with spinner

### Error State
- Top banner: red bg rgba(239,68,68,0.15), border-left 3px solid #ef4444
  - Icon: AlertCircle (16px red) + error message text + ✕ close button
  - Font 13px, #fca5a5

### Empty State (no data yet — before first Refresh)
- Centred card: "No data yet" heading + "Click Refresh to run the first analysis"
  + blue Refresh button

### Disconnected (no session)
- Redirect to /connect page immediately

---

## Connect Page (/connect)

- Full-page centred card, dark bg
- Logo + "Nuvaro Flow" heading
- Subheading: "Connect your Xero account to start analysing your O2C process"
- Blue "Connect Xero" button → GET /api/auth/xero
- Footer: "Secure OAuth 2.0 connection. We only read invoice data."

---

## Files to Write

```
src/lib/types.ts                      shared TypeScript interfaces
src/lib/session.ts                    iron-session config + getSession()
src/lib/xero.ts                       Xero API client: getInvoices(), getHistory(),
                                      refreshToken()
src/lib/event-log.ts                  build XeroEvent[] from invoices + histories
src/lib/process-miner.ts              variants, cycle times, bottlenecks, rework rate
src/lib/ai-explainer.ts               Claude API call → plain English report string
src/lib/utils.ts                      cn() class merge helper, formatCurrency()

src/app/api/auth/xero/route.ts        GET → redirect to Xero OAuth
src/app/api/auth/callback/route.ts    GET → exchange code, save session, redirect /
src/app/api/analyse/route.ts          POST → full pipeline, returns AnalysisResult JSON
src/app/api/disconnect/route.ts       POST → destroy session

src/app/globals.css                   dark bg, Inter font, base resets
src/app/layout.tsx                    root layout
src/app/page.tsx                      server component: check session, render dashboard
src/app/connect/page.tsx              connect screen

src/components/Sidebar.tsx            fixed left nav with icons + connection dot
src/components/Header.tsx             title + date range display + refresh button
src/components/KpiCard.tsx            single KPI card with value, label, delta
src/components/Dashboard.tsx          client component: orchestrates layout + state
src/components/BottlenecksChart.tsx   Recharts horizontal bar (use client)
src/components/ActivityMixChart.tsx   Recharts donut (use client)
src/components/EndStatesChart.tsx     Recharts horizontal bar, colour-coded (use client)
src/components/VariantsTable.tsx      styled HTML table
src/components/AiPanel.tsx            AI insights with parsed findings + badges
src/components/EventLog.tsx           collapsible raw event log table

tailwind.config.ts                    extend with brand colour tokens
.env.local.example                    template for env vars (gitignored actual file)
```

---

## Environment Variables

```
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=http://localhost:3000/api/auth/callback
ANTHROPIC_API_KEY=
SESSION_SECRET=                       # random 32+ char string — generate with:
                                      # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Vercel production:
```
XERO_REDIRECT_URI=https://<your-vercel-url>/api/auth/callback
```

---

## Xero App Portal Change Required
Current redirect URI: `http://localhost:5000/callback` (Python Flask — no longer needed)

Add both in Xero developer portal:
  - `http://localhost:3000/api/auth/callback`     (local dev)
  - `https://<vercel-url>/api/auth/callback`      (production)

Required scopes (same as Python version):
  openid, profile, email, accounting.invoices, accounting.contacts,
  accounting.payments, accounting.settings.read, offline_access
