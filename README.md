# TAI Labs Prototype Suite

Four AI-backed prototype tools built for a TAI Labs Product/GTM Engineer Intern take-home assessment. See `prompt.md` for the original brief, `docs/assessment-part1-answers.md` for the written Part 1 answers (tools, architecture, deployment, novelty), and `docs/superpowers/specs/2026-08-17-tai-tools-design.md` for the design.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in GOOGLE_API_KEY and DATABASE_URL
npx prisma db push           # create tables from prisma/schema.prisma
npx tsx prisma/seed.ts       # load the seed data described below
npm run dev
```

Open `http://localhost:3000`. Any Postgres instance works for `DATABASE_URL` (Supabase, Railway, Neon, local) — all four tools persist through Prisma, nothing is in-memory. If you'd rather not run the Prisma CLI, `prisma/seed.sql` is a plain-SQL fallback (schema + seed combined) you can paste into the Supabase SQL Editor. `GET /api/health` reports live DB connectivity and row counts per table — check it first if something looks empty. The model used for AI analysis is Gemini (default `gemini-3.5-flash-lite` — the cheapest tier; overridable via the `GOOGLE_MODEL` env var).

```bash
npm run lint        # eslint (eslint-config-next)
npm run typecheck   # tsc --noEmit
npm test            # vitest — unit tests for the deterministic scoring logic
npm run build       # production build, must pass before shipping
```

## Adoption Evidence Engine (`/adoption-evidence`)

**What it does:** Approved workflows are "instrumented" — after every run they phone home with a heartbeat. The engine converts that telemetry into a deterministic behavior-change score (0-100: adherence to the claimed run frequency, trend, recency) with four levels: strong / slipping / at-risk / stalled. An executive strip shows measured vs claimed time saved, average score, and adoption-theater count. "Run Adoption Analysis" sends the workflow's telemetry and description to Gemini, which returns a structured diagnosis and a suggested intervention. "Simulate run" posts a heartbeat to the ingestion endpoint, exactly as a real instrumented workflow would.

**Why architected this way:** The score is arithmetic, computed in plain code — reproducible and auditable by an executive; the AI explains the *why* and recommends the *what next*, and is forced into a strict schema so the UI always gets the same shape. This separation ("arithmetic in code, judgment in AI") is the same pattern as the Shadow Scanner's aggregate view, and it means the dashboard still works even if the model is down.

**What I'd do differently with more time:** The weekly-run counts already persist in Postgres, but as a fixed-length array column capped at 12 weeks — I'd model heartbeats as an append-only event table instead (a row per heartbeat), so history isn't capped and rollups can run on a schedule rather than being baked into the array shape. I'd also instrument the workflow's *output* (e.g. was the produced artifact actually referenced downstream) rather than only counting runs — run counts can be gamed, reliance is harder to fake.

**Why this matters to TAI's clients:** Right now TAI proves adoption once, at launch, mostly by self-report. This turns every approved workflow into a continuously-reported evidence stream — so the executive asking "did the AI training actually change the work?" gets a dashboard answer instead of a promise, and adoption theater is caught before it costs a renewal.

## Workflow Drift Monitor (`/drift-monitor`)

**What it does:** Lists the org's approved workflows with their dependencies and approval/verification dates. "Run Health Check" sends a workflow's description and dependency list to Gemini, which returns a structured risk assessment (healthy / at-risk / broken), reasoning on dependency and description consistency, and a one-line suggested next action.

**Why architected this way:** The risk assessment is inherently a judgment call over unstructured text (does this dependency sound stale? does the description still match how it's used?) — exactly the kind of reasoning an LLM is suited for, and exactly why it needs a forced schema rather than freeform text: the UI needs a reliable `riskLevel` enum to sort into columns, not prose to parse.

**What I'd do differently with more time:** Persist assessment history so drift is visible over time (a workflow trending from healthy → at-risk across checks), not just the latest snapshot. Real dependency-change detection would also pull from an actual API-status source instead of inferring purely from the text description.

**Why this matters to TAI's clients:** Right now, TAI proves a workflow works once, at launch — then goes silent. This closes that gap: it catches value quietly decaying (an API deprecated, a tool swapped out, the person who understood it gone) before an executive finds out the "adopted" workflow has been broken for months.

## Manager Review Copilot (`/review-copilot`)

**What it does:** An employee submits a workflow (what it does, what it uses, claimed time savings, data touched). Gemini generates a structured review brief: a plain-language explanation, 3-5 questions the manager should ask, risk flags, and a recommendation with reasoning. The manager approves, approves with changes, or rejects — a simple status change persisted to Postgres.

**Why architected this way:** The brief's whole value is a fixed, always-present shape — a manager under time pressure needs the same fields every time, not a chatty response that sometimes has a risk section and sometimes doesn't. Forcing the schema guarantees that. Approval is deliberately just a status flip with no re-call to the model — the AI's job is to inform the decision, not make it.

**What I'd do differently with more time:** Real auth so "manager" is a specific person tied to specific employees, and a notification back to the employee on status change. I'd also let the manager ask a follow-up question against the brief instead of only reading it.

**Why this matters to TAI's clients:** Managers are the approval bottleneck in TAI's loop, and most aren't equipped to evaluate an AI workflow on their own — today that step is a rubber stamp. This gives every manager the equivalent of an AI-literate colleague's first pass, so approvals reflect an actual judgment instead of a formality.

## Shadow AI Discovery Scanner (`/shadow-scanner`, `/shadow-scanner/aggregate`)

**What it does:** A short free-text survey asks what AI tools someone has used at work informally, for what, and how often. Gemini extracts the tools mentioned, a use-case category, an informal-usage risk flag (or null), and a one-line summary per response. The aggregate view (plain JS, no AI call) ranks the most common tools, use cases, and risk flags across all responses.

**Why architected this way:** Individual responses need AI because they're free text with no fixed shape — someone might mention two tools in one sentence or bury a risk in a casual aside. The aggregate view is deliberately not an AI call: once each response has a structured `analysis`, counting and ranking is plain arithmetic, and doing it in code instead of asking a model to "summarize the responses" keeps the numbers exact and reproducible.

**What I'd do differently with more time:** Cluster free-text use-case categories that are near-duplicates ("internal comms" vs "internal communications") instead of trusting the model to be perfectly consistent across calls, and add a per-flag severity so the ranked list can be sorted by risk, not just frequency.

**Why this matters to TAI's clients:** TAI's enablement program is currently designed on guesses about what employees already do with AI. This turns that guess into a real, low-friction data source — the risk flags alone (client data in a personal chatbot, financial data in an unvetted tool) are the kind of finding that reshapes how a rollout should actually be scoped.

## Build verification

- `npm run build`, `npm run typecheck`, and `npm run lint` pass clean.
- `npm test` runs the unit suite for `computeAdoptionMetrics` (the deterministic scoring core behind Adoption Evidence) — all four adoption levels plus edge cases like an unrun workflow and a claim-exceeding week.
- Each tool sanity-checked against its seed data (`prisma/seed.ts`): 4 instrumented workflows (one per adoption level) in Adoption Evidence; 3 workflows (one healthy, one at-risk, one broken) in Drift Monitor; 3 submissions of varying quality in Review Copilot; 8 survey responses (2 with real risk flags) in the Shadow Scanner aggregate view.
- Error banners verified by running each tool with `GOOGLE_API_KEY` unset.
- Persistence reliability: every update/delete path catches Prisma's "record not found" error and returns a clean 404 instead of crashing; every CRUD/analyze route is wrapped so a database outage returns typed JSON instead of Next's generic error page.
- Note: `npm run build` passes cleanly and all six routes (`/`, `/adoption-evidence`, `/drift-monitor`, `/review-copilot`, `/shadow-scanner`, `/shadow-scanner/aggregate`) render with a 200 and real HTML; the no-key error banners return typed 502 JSON errors instead of crashing. Live-AI paths (adoption analysis, drift health checks, review briefs, survey analyses, heartbeat) were walked end-to-end with a real `GOOGLE_API_KEY` on `gemini-3.6-flash` and re-verified on `gemini-3.5-flash-lite`. Note: `gemini-2.5-flash` is retired for new users — the API rejects it and recommends the 3.x flash line, which is why the default is `gemini-3.5-flash-lite`.
