# TAI Labs Prototype Suite

Three AI-backed prototype tools built for a TAI Labs Product/GTM Engineer Intern take-home assessment. See `prompt.md` for the original brief and `docs/superpowers/specs/2026-08-17-tai-tools-design.md` for the full design.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npm run dev
```

Open `http://localhost:3000`. No database or other setup required — all data is seeded in-memory on server start.

## Workflow Drift Monitor (`/drift-monitor`)

**What it does:** Lists the org's approved workflows with their dependencies and approval/verification dates. "Run Health Check" sends a workflow's description and dependency list to Claude, which returns a structured risk assessment (healthy / at-risk / broken), reasoning on dependency and description consistency, and a one-line suggested next action.

**Why architected this way:** The risk assessment is inherently a judgment call over unstructured text (does this dependency sound stale? does the description still match how it's used?) — exactly the kind of reasoning an LLM is suited for, and exactly why it needs a forced schema rather than freeform text: the UI needs a reliable `riskLevel` enum to sort into columns, not prose to parse. State lives in-memory because "assessed once, checked again later" doesn't need durability beyond a single demo session.

**What I'd do differently with more time:** Persist assessment history so drift is visible over time (a workflow trending from healthy → at-risk across checks), not just the latest snapshot. Real dependency-change detection would also pull from an actual API-status source instead of inferring purely from the text description.

**Why this matters to TAI's clients:** Right now, TAI proves a workflow works once, at launch — then goes silent. This closes that gap: it catches value quietly decaying (an API deprecated, a tool swapped out, the person who understood it gone) before an executive finds out the "adopted" workflow has been broken for months.

## Manager Review Copilot (`/review-copilot`)

**What it does:** An employee submits a workflow (what it does, what it uses, claimed time savings, data touched). Claude generates a structured review brief: a plain-language explanation, 3-5 questions the manager should ask, risk flags, and a recommendation with reasoning. The manager approves, approves with changes, or rejects — a simple in-memory status change.

**Why architected this way:** The brief's whole value is a fixed, always-present shape — a manager under time pressure needs the same fields every time, not a chatty response that sometimes has a risk section and sometimes doesn't. Forcing the schema guarantees that. Approval is deliberately just a status flip with no re-call to the model — the AI's job is to inform the decision, not make it.

**What I'd do differently with more time:** Real auth so "manager" is a specific person tied to specific employees, and a notification back to the employee on status change. I'd also let the manager ask a follow-up question against the brief instead of only reading it.

**Why this matters to TAI's clients:** Managers are the approval bottleneck in TAI's loop, and most aren't equipped to evaluate an AI workflow on their own — today that step is a rubber stamp. This gives every manager the equivalent of an AI-literate colleague's first pass, so approvals reflect an actual judgment instead of a formality.

## Shadow AI Discovery Scanner (`/shadow-scanner`, `/shadow-scanner/aggregate`)

**What it does:** A short free-text survey asks what AI tools someone has used at work informally, for what, and how often. Claude extracts the tools mentioned, a use-case category, an informal-usage risk flag (or null), and a one-line summary per response. The aggregate view (plain JS, no AI call) ranks the most common tools, use cases, and risk flags across all responses.

**Why architected this way:** Individual responses need AI because they're free text with no fixed shape — someone might mention two tools in one sentence or bury a risk in a casual aside. The aggregate view is deliberately not an AI call: once each response has a structured `analysis`, counting and ranking is plain arithmetic, and doing it in code instead of asking a model to "summarize the responses" keeps the numbers exact and reproducible.

**What I'd do differently with more time:** Cluster free-text use-case categories that are near-duplicates ("internal comms" vs "internal communications") instead of trusting the model to be perfectly consistent across calls, and add a per-flag severity so the ranked list can be sorted by risk, not just frequency.

**Why this matters to TAI's clients:** TAI's enablement program is currently designed on guesses about what employees already do with AI. This turns that guess into a real, low-friction data source — the risk flags alone (client data in a personal chatbot, financial data in an unvetted tool) are the kind of finding that reshapes how a rollout should actually be scoped.

## Build verification

- `npm run build` passes.
- Each tool sanity-checked against its seed data: 3 workflows (one healthy, one at-risk, one broken) in Drift Monitor; 3 submissions of varying quality in Review Copilot; 8 survey responses (2 with real risk flags) in the Shadow Scanner aggregate view.
- Error banners verified by running each tool with `ANTHROPIC_API_KEY` unset.
- Note: this sandbox had no `ANTHROPIC_API_KEY` available, so the live-AI paths (actual Claude-generated health checks, review briefs, and survey analyses) were not walked end-to-end here. What was verified in this environment: `npm run build` passes cleanly, all five routes (`/`, `/drift-monitor`, `/review-copilot`, `/shadow-scanner`, `/shadow-scanner/aggregate`) render with a 200 and real HTML, and the no-key error banners return typed 502 JSON errors instead of crashing. Re-walking the seed-data paths with a real key (as described above) is deferred to whoever runs this locally with `ANTHROPIC_API_KEY` set.
