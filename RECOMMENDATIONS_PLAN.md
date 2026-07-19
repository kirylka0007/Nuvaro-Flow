# Nuvaro Flow — Recommendations + Chat: Implementation Plan

Hand this file to the implementing session. Goal: make the AI's **recommendations
prominent for the business**, and let the business **chat with the model to dig deeper**.

Locked decisions:
- **Structured JSON recommendations** (not freeform markdown).
- **Full-width hero** for recommendations as the dashboard centrepiece.
- **Seedable slide-over chat** ("Dig deeper" per recommendation).
- **`claude-opus-4-8`** for insights, **`claude-sonnet-4-6`** for chat.

---

## Ground rules (read first)
- **`AGENTS.md` is binding:** this is Next.js 16.2.7 (Turbopack) and the repo warns APIs
  differ from training data. **Before writing any route handler or streaming code, read the
  relevant guide under `node_modules/next/dist/docs/`** (route handlers, streaming responses,
  runtime). Do not assume old App Router signatures.
- Match existing style: inline `style={{}}` with the BUILD_PLAN colour tokens, `lucide-react`
  icons, Tailwind utility classes, `'use client'` where needed.
- Model IDs: **`claude-opus-4-8`** for insights, **`claude-sonnet-4-6`** for chat.
  (Replace the stale `claude-opus-4-7`.)

---

## Phase 1 — Structured AI output (foundation)

**`src/lib/types.ts`** — add:
```ts
export type Severity = 'critical' | 'warning' | 'opportunity' | 'healthy'

export interface Recommendation {
  id: string                  // stable slug, e.g. "stuck-at-created"
  title: string               // short headline
  severity: Severity
  finding: string             // what the data shows
  impact: string              // plain-English business consequence
  valueAtRisk: number | null  // £ amount if quantifiable, else null
  action: string              // concrete next step the business should take
  evidence: string[]          // 1–3 facts drawn from the mining data
  relatedActivities?: string[]
}

export interface AiInsights {
  headline: string            // one-line executive summary
  recommendations: Recommendation[]
}
```
Change `AnalysisResult`: replace `aiReport: string` with `aiInsights: AiInsights`.
(See Phase 2 note on keeping `aiReport` temporarily for the AiPanel fallback.)

**`src/lib/ai-explainer.ts`** — rewrite `generateInsights` to return `AiInsights` via
**Anthropic tool-use structured output** (reliable JSON, no regex):
- Define one tool, e.g. `emit_insights`, whose `input_schema` mirrors `AiInsights`.
- Call with `model: 'claude-opus-4-8'`, `tool_choice: { type: 'tool', name: 'emit_insights' }`.
- Read `message.content`, find the `tool_use` block, return `block.input as AiInsights`.
- Keep the existing rich prompt context (summary, variants, bottlenecks, cycle times), but
  instruct: rank recommendations most-impactful first; set `severity` honestly; only fill
  `valueAtRisk` when derivable from the data; ground every `evidence` item in the provided
  numbers.

**`src/app/api/analyse/route.ts`** — change the `result` object to use `aiInsights` instead
of `aiReport`. No other pipeline changes.

---

## Phase 2 — Prominent recommendations (full-width hero)

**New `src/components/RecommendationsHero.tsx`** (`'use client'`):
- Full-width section directly under `Header`. Show optional `headline` as a 14px summary line.
- Render `recommendations` as a responsive card grid (2–3 per row). Each card:
  - Severity pill + left accent bar. Colour map:
    `critical → #ef4444`, `warning → #f59e0b`, `opportunity → #00D4FF`, `healthy → #22c55e`.
  - `title` (bold), `impact` line with `£` amounts highlighted `#00D4FF` weight 600.
  - `action` styled as a CTA line (small arrow prefix).
  - **"Dig deeper" button** → calls `onDigDeeper(rec)` (wired in Phase 3).
- Card bg `#0D1B2E`, border `1px solid rgba(30,127,216,0.2)`, radius 10px, padding 16px.

**`src/components/Dashboard.tsx`** — reorder layout:
1. `Header`
2. **`RecommendationsHero`** (full width) ← new centrepiece
3. KPI row (unchanged)
4. Charts — now full-width since the AI column moves: 2×2 grid expands, or 4-up.
5. `EventLog`
- Bump `LS_KEY` to `nuvaro_flow_analysis_v2` so stale freeform-shape data isn't parsed.
- Update any logic that referenced `aiReport`.

**`src/components/AiPanel.tsx`** — **keep as a transition fallback** (do NOT delete in this pass):
- Leave the component intact for now. During the transition, the analyse pipeline may continue
  to populate a legacy `aiReport` string in parallel so the old panel still renders if needed.
- Move it out of the primary layout (the hero is now the focus). Acceptable options: render it
  collapsed/behind a toggle, or in a secondary position below the charts.
- Add a clearly marked `// TODO: retire AiPanel once RecommendationsHero is validated` so the
  cleanup is a deliberate later step, not forgotten.
- Do not depend on its regex parser (`parseReport`/`riskLevel`) for any new feature.

> Practical implication: during transition, `AnalysisResult` may carry **both** `aiInsights`
> (new, primary) and `aiReport` (legacy, optional). Type the legacy field as optional
> (`aiReport?: string`) and have the analyse route populate whichever is cheap to keep.
> Once the hero is validated, drop `aiReport`, delete `AiPanel.tsx`, and remove its helpers.

---

## Phase 3 — Chat to dig deeper (seedable slide-over)

**New `src/app/api/chat/route.ts`** (POST, streaming):
- Request body:
  ```ts
  {
    messages: { role: 'user' | 'assistant'; content: string }[],
    context: { summary: EventSummary; processMining: ProcessMiningResult; insights: AiInsights },
    focusRecommendationId?: string
  }
  ```
- Server is stateless, so the **client sends the compact context each call** (summary +
  processMining + insights — **not** the full event log, to keep payloads small).
- Build a system prompt embedding that context as JSON + the focused recommendation (if
  `focusRecommendationId`). Instruct: answer only from provided data, quantify in `£`, say so
  when data is insufficient.
- Call `client.messages.stream({ model: 'claude-sonnet-4-6', system, messages, max_tokens: 1024 })`
  and return a streamed `Response`. **Confirm the exact streaming-Response pattern against the
  Next.js docs in `node_modules/next/dist/docs/` before coding.** If streaming proves fiddly
  under this Next version, fall back to a single non-streamed JSON `{ reply }` — but target
  streaming.

**New `src/components/ChatDrawer.tsx`** (`'use client'`):
- Slide-over panel (fixed right, ~420px, translate-x transition, dark scrim). Props: `open`,
  `onClose`, `context`, `seedRecommendation?: Recommendation`.
- On open with a seed: show a context chip ("Digging into: {title}") and auto-send a first
  user turn referencing that recommendation.
- Message list (user right / assistant left), streaming append, input box + send,
  disabled/spinner while streaming. Reuse the `£`-highlight treatment for amounts.

**`src/components/Dashboard.tsx`** — own chat state: `chatOpen`, `seedRec`. Pass
`onDigDeeper={(rec) => { setSeedRec(rec); setChatOpen(true) }}` to the hero; render
`<ChatDrawer .../>`. Optionally wire the Sidebar "AI Insights" item to open the drawer with no
seed (general Q&A).

---

## Phase 4 — Verify
- `npm run build` must pass clean (TypeScript strict).
- `npm run dev`, click **Refresh data**: confirm hero cards render from structured
  `aiInsights`, severity colours correct, `£` amounts highlighted.
- Click **Dig deeper** on a card → drawer opens seeded, streamed answer grounded in that
  recommendation.
- Confirm the AiPanel fallback still renders (or is cleanly toggled) and nothing references a
  required `aiReport`.

---

## Suggested commit slices
1. Structured types + `ai-explainer` tool-use + analyse route (keep optional `aiReport`).
2. `RecommendationsHero` + Dashboard reorder + AiPanel demoted to fallback.
3. `/api/chat` + `ChatDrawer` + wiring.
4. (Later, separate PR) Retire `aiReport` + delete `AiPanel.tsx` + helpers.

---

## Key risks
- **Next 16 streaming-Response signature** — verify against the bundled docs; don't trust
  memory.
- **Context payload size** if real client data has thousands of events — the plan deliberately
  excludes the raw event log from the chat context. If the model needs invoice-level detail,
  send a trimmed/sampled subset, not the full log.
