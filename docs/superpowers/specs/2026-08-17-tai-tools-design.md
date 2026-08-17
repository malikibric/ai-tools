# TAI Labs Assessment: 3 New Tool Prototypes — Design

## Context

Take-home assessment for a Product/GTM Engineer Intern role at TAI Labs. TAI Labs sells AI-workforce-transformation software (TAI Workforce, self-serve; TAI Enablement, org-wide) whose core loop is: diagnose → personalized pathway → AI tutor → employee builds workflow → manager approves → adoption measured.

This spec covers three new prototype tools that plug gaps in that loop:

1. **Workflow Drift Monitor** — flags approved workflows whose dependencies/behavior have likely drifted since approval.
2. **Manager Review Copilot** — turns an employee's raw workflow submission into a structured brief a non-AI-literate manager can actually act on.
3. **Shadow AI Discovery Scanner** — surveys informal/unsanctioned AI usage and aggregates it into a rollout-planning artifact.

Full problem statements and hard constraints are in `prompt.md` at the repo root.

### Scope note: no existing prototype to match

`prompt.md` assumes an existing TAI prototype (design system, stack version, an "Auto-Debrief" tool) that these three tools should match and link alongside. No such prototype exists in this repo or anywhere accessible for this assessment. Decision (confirmed with user): invent the stack and design system fresh for this suite, and skip any Auto-Debrief link — the landing page indexes only the three new tools.

## Architecture

One Next.js 15 (App Router) + TypeScript app, deployable as a single Vercel project. Each tool is a self-contained feature folder (UI page + its own API route); cross-tool code (design tokens, AI call wrapper, per-tool schemas, in-memory stores) lives under `lib/`.

```
app/
  page.tsx                     # landing page — 3 tool cards, no Auto-Debrief placeholder
  layout.tsx, globals.css      # dark navy + amber tokens, Space Grotesk/Inter/IBM Plex Mono
  drift-monitor/page.tsx
  api/drift-monitor/route.ts   # POST: run health check on one workflow
  review-copilot/page.tsx
  api/review-copilot/route.ts  # POST: submit + generate brief; PATCH: set approval status
  shadow-scanner/page.tsx
  api/shadow-scanner/route.ts  # POST: submit response + analyze; GET: aggregate view
lib/
  ai.ts                         # callStructured(schema, prompt) — single Anthropic/Vercel-AI-SDK wrapper
  schemas/
    drift-assessment.ts         # Zod schema — doubles as emit_drift_assessment tool schema and TS type
    review-brief.ts             # Zod schema — emit_review_brief
    survey-analysis.ts          # Zod schema — emit_survey_analysis
  store/
    workflows.ts                # in-memory array + seed data, module-level singleton
    submissions.ts
    survey-responses.ts
  ui/                            # shared Card, Badge, RiskPill, Layout, etc.
```

**Backend mechanism:** Route Handlers (`app/api/**/route.ts`), not Server Actions. Chosen because `prompt.md` itself describes the AI-calling units as "routes" — this makes each one a literal, curl-able endpoint with its own schema and fallback behavior, which is easier to walk through in an interview than an implicit server-action call.

**Data layer:** In-memory, module-level arrays seeded at import time — no Supabase/Postgres. State lives in the running server process: it survives page refreshes (same process) and resets on server restart/redeploy. Chosen over Supabase because it needs zero external setup (demoable with only `ANTHROPIC_API_KEY`), keeps the entire "database" readable as three small seed files, and the assessment's demo/interview bar doesn't require durability across restarts.

**AI SDK:** Vercel AI SDK (`ai` package) with the Anthropic provider, using `generateObject` against a Zod schema per tool to force structured output (functionally equivalent to forced tool-use / `tool_choice`).

**Styling:** Tailwind CSS, with the dark-navy + amber palette and font stack (Space Grotesk / Inter / IBM Plex Mono) defined once as CSS variables / Tailwind theme tokens, reused across all three tools' UI so they read as one product.

**Language:** TypeScript throughout.

## Data model

Each tool has exactly one Zod schema that serves double duty: the structured-output schema passed to the model, and the TypeScript type for that tool's result. No separate parsing or mapping layer between "what the model returns" and "what the UI renders."

```ts
// lib/schemas/drift-assessment.ts
export const DriftAssessment = z.object({
  riskLevel: z.enum(["healthy", "at_risk", "broken"]),
  dependencyChangeLikelihood: z.string(),   // 1-2 sentence reasoning
  descriptionConsistency: z.string(),        // 1-2 sentence reasoning
  suggestedNextAction: z.string(),           // one line
});

// lib/schemas/review-brief.ts
export const ReviewBrief = z.object({
  plainLanguageExplanation: z.string(),
  managerQuestions: z.array(z.string()).min(3).max(5),
  riskFlags: z.array(z.string()),            // empty array = none
  recommendation: z.enum(["approve", "approve_with_changes", "needs_discussion"]),
  recommendationReasoning: z.string(),
});

// lib/schemas/survey-analysis.ts
export const SurveyAnalysis = z.object({
  toolsMentioned: z.array(z.string()),
  useCaseCategory: z.string(),
  riskFlag: z.string().nullable(),           // null = no risk
  summary: z.string(),                       // one line
});
```

Entity records (`Workflow`, `Submission`, `SurveyResponse`) hold their seed fields plus an optional `assessment` / `brief` / `analysis` field of the corresponding schema type, populated once the AI call for that record has run. `Submission` additionally carries a mutable `status: "pending" | "approved" | "approved_with_changes" | "rejected"`, changed only by the manager action, never by the AI call.

Stores are plain arrays per module (`let workflows: Workflow[] = [...]`), seeded at import time, mutated in place by route handlers.

## Per-tool flow

### 1. Workflow Drift Monitor
- Initial render is a server component reading `lib/store/workflows.ts` directly (no fetch needed), grouped into columns: healthy / at-risk / broken / not-yet-checked.
- "Run Health Check" → `POST /api/drift-monitor { workflowId }` → route loads the workflow, calls `callStructured(DriftAssessment, prompt)` with name/description/dependencies/approved+verified dates → writes `assessment` onto the store record → returns it → client updates that card in place and opens its detail panel (shows full reasoning + suggested action).
- Seed data (3 workflows, chosen to show range): one healthy (stable internal script, nothing flagged in its own description), one at-risk (dependency description hints at a recent breaking change), one broken (dependency list explicitly names a deprecated API).

### 2. Manager Review Copilot
- Two-pane page: left = submission form + list of existing submissions; right = the selected submission's generated brief.
- Submit → `POST /api/review-copilot { whatItDoes, toolOrPromptUsed, claimedTimeSavedPerWeek, dataTouched }` → route calls `callStructured(ReviewBrief, prompt)` → stores submission + brief with `status: "pending"` → client selects it and renders the brief pane.
- Manager clicks approve / approve-with-changes / reject → `PATCH /api/review-copilot { id, status }` → in-memory status update only, no re-call to the model.
- Seed data (3 submissions of visibly different quality): one clean low-risk submission (should skew toward "approve"), one with over-claimed time savings and no stated fallback (should skew toward "needs discussion"), one touching sensitive customer data via a consumer-grade tool (should surface a risk flag).

### 3. Shadow AI Discovery Scanner
- Survey page: 3-4 open-ended free-text questions → `POST /api/shadow-scanner { answers }` → `callStructured(SurveyAnalysis, prompt)` → response appended to the store with its `analysis` → confirmation state shown to the respondent.
- Aggregate page: reads all analyzed responses; most-common tools, most-common use-case categories, and a ranked risk-flag list are computed in plain JS (counting/grouping over `toolsMentioned` / `useCaseCategory` / non-null `riskFlag`) — not another AI call.
- Seed data: 8 responses, pre-populated with their `analysis` already computed, so the aggregate view has substance on first load without 8 live API calls at demo time. Includes at least two with real risk flags (e.g. "pasted client data into a personal ChatGPT account," "no oversight on a tool touching financial data").

## Error handling

`lib/ai.ts` exports one function, `callStructured(schema, prompt)`, used by all three routes:
- Missing `process.env.ANTHROPIC_API_KEY` → throws a typed `MissingApiKeyError` before any network call.
- `generateObject` failure (network error, or model output that fails the Zod schema after the AI SDK's internal retry/repair) → caught and re-thrown as a typed `AICallError`.
- Each route handler catches both error types and returns `NextResponse.json({ error: { kind, message } }, { status: 502 })` — a route never crashes to a 500.
- Each tool's page renders a distinct inline error banner depending on `error.kind` ("AI service unavailable — check ANTHROPIC_API_KEY" vs "Model returned unexpected output, try again") instead of a generic failure state, so the demo degrades legibly if the key is absent or a call fails.

## Testing / verification

No formal automated test suite — out of scope for a take-home demo. Verification is:
1. `npm run build` passes.
2. Manually exercise each tool's seed-data path: run the health check on all 3 workflows, submit and view all 3 review briefs, load the Shadow Scanner aggregate view.
3. Unset `ANTHROPIC_API_KEY` and confirm each tool's error banner appears correctly rather than crashing.

## Deliverables checklist (from prompt.md)

1. Working code for all three tools as routes/modules in one app.
2. A short README section per tool: what it does, why it's architected this way, what you'd do differently with more time.
3. Confirmation `npm run build` passes and each tool has been sanity-checked against its seed data.
4. A 2-3 sentence non-technical "why this is valuable to TAI's clients" blurb per tool.
