# TAI Labs Assessment: Prototype Tools — Design

## Context

Take-home assessment for a Product/GTM Engineer Intern role at TAI Labs. TAI Labs sells AI-workforce-transformation software (TAI Workforce, self-serve; TAI Enablement, org-wide) whose core loop is: diagnose → personalized pathway → AI tutor → employee builds workflow → manager approves → adoption measured.

This spec covers four prototype tools that plug gaps in that loop, centered on the loop's weakest link — "adoption gets measured" is today a one-time, mostly self-reported event:

1. **Adoption Evidence Engine** — instrumented workflows phone home; telemetry is converted deterministically into a behavior-change score and an executive evidence pack (measured vs claimed time saved, adoption theater). Gemini explains why and what to do next. This is the flagship, built for Part 2 of the assessment.
2. **Workflow Drift Monitor** — flags approved workflows whose dependencies/behavior have likely drifted since approval.
3. **Manager Review Copilot** — turns an employee's raw workflow submission into a structured brief a non-AI-literate manager can actually act on.
4. **Shadow AI Discovery Scanner** — surveys informal/unsanctioned AI usage and aggregates it into a rollout-planning artifact.

Full problem statements and hard constraints are in `prompt.md` at the repo root; written Part 1 answers (tools, architecture, deployment, novelty) are in `docs/assessment-part1-answers.md`.

### Scope note: no existing prototype to match

`prompt.md` assumes an existing TAI prototype (design system, stack version, an "Auto-Debrief" tool) that these tools should match and link alongside. No such prototype exists in this repo or anywhere accessible for this assessment. Decision: invent the stack and design system fresh for this suite, and skip any Auto-Debrief link — the landing page indexes the four tools only.

## Architecture

One Next.js 15 (App Router) + TypeScript app, deployable as a single Vercel project. Each tool is a self-contained feature folder — its page, client components, tool-specific UI, schema, and store all live under one directory — while cross-tool code (design tokens, AI call wrapper, HTTP validation, shared UI) lives under `lib/`.

```
app/
  page.tsx                     # landing page — 4 tool cards
  layout.tsx, globals.css      # dark navy + amber tokens, Space Grotesk/Inter/IBM Plex Mono
  adoption-evidence/
    page.tsx                   # server page (reads the store directly, computes summary)
    AdoptionEvidenceClient.tsx # dashboard: score cards, sparklines, detail panel
    AdoptionPill.tsx           # tool-specific level pill
  drift-monitor/
    page.tsx, DriftMonitorClient.tsx, RiskPill.tsx
  review-copilot/
    page.tsx, ReviewCopilotClient.tsx, Badge.tsx
  shadow-scanner/
    page.tsx, SurveyForm.tsx
    aggregate/page.tsx         # plain-JS aggregate view over structured analyses
  api/
    adoption-evidence/route.ts         # POST: run Gemini adoption analysis on one workflow
    adoption-evidence/heartbeat/route.ts  # POST: workflow phones home with a run (telemetry)
    drift-monitor/route.ts             # POST: run health check on one workflow
    review-copilot/route.ts            # POST: submit + generate brief; PATCH: set approval status
    shadow-scanner/route.ts            # POST: submit response + analyze
lib/
  ai.ts                         # callStructured(schema, prompt) — single Gemini/Vercel-AI-SDK wrapper
  http.ts                       # readJsonBody (Zod-validated body), badRequest/notFound helpers
  tools/                        # one folder per tool — schema doubles as the TS type
    adoption-evidence/schema.ts, store.ts
    drift-monitor/schema.ts, store.ts
    review-copilot/schema.ts, store.ts
    shadow-scanner/schema.ts, store.ts
  ui/                           # shared Card, PageShell
```

**Backend mechanism:** Route Handlers (`app/api/**/route.ts`), not Server Actions. Chosen because each tool's AI-calling unit is a literal, curl-able endpoint with its own schema and fallback behavior, which is easier to walk through in an interview than an implicit server-action call.

**Data layer:** In-memory, module-level arrays seeded at import time — no Supabase/Postgres. State lives in the running server process: it survives page refreshes (same process) and resets on server restart/redeploy. Chosen over Supabase because it needs zero external setup (demoable with only `GOOGLE_API_KEY`), keeps the entire "database" readable as small seed files, and the assessment's demo/interview bar doesn't require durability across restarts. Production migration path: heartbeats become an append-only event stream in Postgres; weekly run counts become a rollup view; the score functions are unchanged.

**AI SDK:** Vercel AI SDK (`ai` package) with the Google provider (`@ai-sdk/google`), using `generateObject` against a Zod schema per tool to force structured output (functionally equivalent to forced tool-use / `tool_choice` / strict JSON output). Model: `gemini-3.5-flash-lite` by default (cheapest tier; `gemini-3.6-flash` for better judgment quality), overridable via `GOOGLE_MODEL`. The provider is created with `createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY })` — the SDK's default env-var name (`GOOGLE_GENERATIVE_AI_API_KEY`) is not what we expose.

**Styling:** Tailwind CSS, with the dark-navy + amber palette and font stack (Space Grotesk / Inter / IBM Plex Mono) defined once as CSS variables / Tailwind theme tokens, reused across all four tools' UI so they read as one product.

**Language:** TypeScript throughout.

## Data model

Each tool has exactly one Zod schema that serves double duty: the structured-output schema passed to the model, and the TypeScript type for that tool's result. No separate parsing or mapping layer between "what the model returns" and "what the UI renders."

```ts
// lib/tools/adoption-evidence/schema.ts
export const AdoptionAssessment = z.object({
  diagnosis: z.string(),           // plain-language why adoption is at this level
  suggestedIntervention: z.string(), // one line, for the account manager / CSM
});

// lib/tools/drift-monitor/schema.ts
export const DriftAssessment = z.object({
  riskLevel: z.enum(["healthy", "at_risk", "broken"]),
  dependencyChangeLikelihood: z.string(),   // 1-2 sentence reasoning
  descriptionConsistency: z.string(),        // 1-2 sentence reasoning
  suggestedNextAction: z.string(),           // one line
});

// lib/tools/review-copilot/schema.ts
export const ReviewBrief = z.object({
  plainLanguageExplanation: z.string(),
  managerQuestions: z.array(z.string()).min(3).max(5),
  riskFlags: z.array(z.string()),            // empty array = none
  recommendation: z.enum(["approve", "approve_with_changes", "needs_discussion"]),
  recommendationReasoning: z.string(),
});

// lib/tools/shadow-scanner/schema.ts
export const SurveyAnalysis = z.object({
  toolsMentioned: z.array(z.string()),
  useCaseCategory: z.string(),
  riskFlag: z.string().nullable(),           // null = no risk
  summary: z.string(),                       // one line
});
```

Entity records (`AdoptionWorkflow`, `Workflow`, `Submission`, `SurveyResponse`) hold their seed fields plus an optional `assessment` / `brief` / `analysis` field of the corresponding schema type, populated once the AI call for that record has run. `Submission` additionally carries a mutable `status`, changed only by the manager action, never by the AI call.

**Design principle — arithmetic in code, judgment in AI:** In the Adoption Evidence Engine the behavior-change score, adoption level, and executive aggregates are computed deterministically in plain code (`computeAdoptionMetrics`, `summarizeAdoption` in `lib/tools/adoption-evidence/store.ts`). The score is auditable and reproducible — an executive can verify exactly why a workflow scored 62. The AI only explains the score and recommends the next action, and it is told explicitly not to question the computed level. The Shadow Scanner's aggregate view follows the same pattern (plain JS counts over structured analyses, no AI call).

Stores are plain arrays per module (`let adoptionWorkflows: AdoptionWorkflow[] = [...]`), seeded at import time, mutated in place by route handlers.

## Per-tool flow

### 1. Adoption Evidence Engine
- Initial render is a server component reading `lib/tools/adoption-evidence/store.ts` directly (no fetch needed), with scores computed server-side and an executive summary strip (workflows tracked, strong count, avg score, claimed vs measured time saved).
- Each workflow's card shows its score, level pill, claimed vs actual runs, last-run recency, and a telemetry sparkline. "Simulate run" → `POST /api/adoption-evidence/heartbeat { workflowId }` → the store increments the current week's run count and stamps `lastRunAt` — the exact call a real instrumented workflow would make after each run. Score and summary react immediately.
- "Run Adoption Analysis" → `POST /api/adoption-evidence { workflowId }` → route computes the deterministic metrics, calls `callStructured(AdoptionAssessment, prompt)` with name/description/claimed frequency/weekly runs/score/level, writes the assessment onto the store record → client updates the card in place and opens its detail panel (score breakdown + diagnosis + suggested intervention).
- Seed data (4 workflows, one per level): strong (usage growing, on frequency), slipping (frequency quietly sliding), stalled (approval-theater — used a month, then zero), at-risk (usage collapsed as a dependency died).

### 2. Workflow Drift Monitor
- Initial render is a server component reading `lib/tools/drift-monitor/store.ts` directly (no fetch needed), grouped into columns: healthy / at-risk / broken / not-yet-checked.
- "Run Health Check" → `POST /api/drift-monitor { workflowId }` → route loads the workflow, calls `callStructured(DriftAssessment, prompt)` with name/description/dependencies/approved+verified dates → writes `assessment` onto the store record → returns it → client updates that card in place and opens its detail panel (shows full reasoning + suggested action).
- Seed data (3 workflows, chosen to show range): one healthy (stable internal script, nothing flagged in its own description), one at-risk (dependency description hints at a recent breaking change), one broken (dependency list explicitly names a deprecated API).

### 3. Manager Review Copilot
- Two-pane page: left = submission form + list of existing submissions; right = the selected submission's generated brief.
- Submit → `POST /api/review-copilot { whatItDoes, toolOrPromptUsed, claimedTimeSavedPerWeek, dataTouched }` → route calls `callStructured(ReviewBrief, prompt)` → stores submission + brief with `status: "pending"` → client selects it and renders the brief pane.
- Manager clicks approve / approve-with-changes / reject → `PATCH /api/review-copilot { id, status }` → in-memory status update only, no re-call to the model.
- Seed data (3 submissions of visibly different quality): one clean low-risk submission (should skew toward "approve"), one with over-claimed time savings and no stated fallback (should skew toward "needs discussion"), one touching sensitive customer data via a consumer-grade tool (should surface a risk flag).

### 4. Shadow AI Discovery Scanner
- Survey page: 3-4 open-ended free-text questions → `POST /api/shadow-scanner { answers }` → `callStructured(SurveyAnalysis, prompt)` → response appended to the store with its `analysis` → confirmation state shown to the respondent.
- Aggregate page: reads all analyzed responses; most-common tools, most-common use-case categories, and a ranked risk-flag list are computed in plain JS (counting/grouping over `toolsMentioned` / `useCaseCategory` / non-null `riskFlag`) — not another AI call.
- Seed data: 8 responses, pre-populated with their `analysis` already computed, so the aggregate view has substance on first load without 8 live API calls at demo time. Includes at least two with real risk flags (e.g. "pasted client data into a personal ChatGPT account," "no oversight on a tool touching financial data").

## Error handling

`lib/ai.ts` exports one function, `callStructured(schema, prompt)`, used by all AI-calling routes:
- Missing `process.env.GOOGLE_API_KEY` → throws a typed `MissingApiKeyError` before any network call.
- `generateObject` failure (network error, or model output that fails the Zod schema after the AI SDK's internal retry/repair) → caught and re-thrown as a typed `AICallError`.
- Each route handler catches both error types and returns `NextResponse.json({ error: { kind, message } }, { status: 502 })` — a route never crashes to a 500.
- Each tool's page renders a distinct inline error banner depending on `error.kind` ("AI service unavailable — check GOOGLE_API_KEY" vs "Model returned unexpected output, try again") instead of a generic failure state, so the demo degrades legibly if the key is absent or a call fails.
- The deterministic parts (adoption scores, aggregates) never call the AI, so the dashboard renders fully even with the model down.

## Testing / verification

No formal automated test suite — out of scope for a take-home demo. Verification is:
1. `npm run typecheck` and `npm run build` pass.
2. Manually exercise each tool's seed-data path: run adoption analysis + a simulated heartbeat on all 4 instrumented workflows, health-check all 3 drift workflows, submit and view all 3 review briefs, load the Shadow Scanner aggregate view.
3. Unset `GOOGLE_API_KEY` and confirm each tool's error banner appears correctly rather than crashing.

## Deliverables checklist (from prompt.md)

1. Working code for all tools as routes/modules in one app.
2. A short README section per tool: what it does, why it's architected this way, what you'd do differently with more time.
3. Confirmation `npm run build` passes and each tool has been sanity-checked against its seed data.
4. A 2-3 sentence non-technical "why this is valuable to TAI's clients" blurb per tool (also used in the written Part 1 answers).
