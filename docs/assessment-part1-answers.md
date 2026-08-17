# TAI Labs Assessment — Part 1: Thinking

## 1. Tools I would build for TAI's clients

TAI's pitch is: *"You've already bought AI tools — TAI makes sure the work actually changes."* The loop is diagnose → pathway → tutor → build → approve → measure. Everything below attacks the weakest link of that loop — the fact that **"adoption gets measured" is currently measured once, at ship time, mostly by self-report.** Three tools + one bonus:

### Tool 1 — Adoption Evidence Engine ("did the work actually change?")

**What it does:** Instruments every approved workflow so it phones home with a heartbeat after each run. Telemetry (runs per week, last run, output produced) is converted — deterministically, in plain code — into a per-workflow behavior-change score (0–100) with four levels: strong / slipping / at-risk / stalled. An executive view aggregates the whole org: measured vs claimed time saved, average score, and an "adoption theater" count (workflows approved but never actually used). AI adds the judgment layer on top: why is usage at this level, and what should the account manager do next.

**Who it is for:** TAI Enablement clients — the executives paying for the program, and the CSM who owns the account. The manager in the loop also sees the score for their own team's workflows.

**Why it is valuable:** Renewals and references are won on evidence. Today TAI can say "we trained N people and built M workflows" — that is activity, not outcome. This tool answers the only question that matters at renewal time: *did the work actually change?* It also exposes adoption theater before the executive discovers it, which is the exact moment trust breaks.

### Tool 2 — Time-Savings Audit ("verify the claim")

**What it does:** An employee submits a workflow claiming "saves 4 hours a week." The audit uses the same heartbeat telemetry to show claimed vs *measured* time saved, over time, per workflow and per team — including the gap between the two.

**Who it is for:** Managers (approving workflows) and CSMs (reporting ROI).

**Why it is valuable:** Today every number in TAI's ROI story is self-reported. Self-reported time savings are systematically optimistic — nobody under-claims. Turning the claim into a measured number makes approvals meaningful (the manager approves a workflow whose savings are real) and makes the ROI story defensible in an executive review.

### Tool 3 — Peer-Workflow Recommendation ("people like you built this")

**What it does:** After the diagnostic step, instead of pointing an employee at generic training content, match their role and detected gaps against the org's already-approved workflow library — real workflows their peers built, vetted by a manager, with measured adoption. "People in your role built this and it worked" becomes the primary learning artifact.

**Who it is for:** Employees mid-pathway; L&D leads who want faster time-to-first-workflow.

**Why it is valuable:** TAI's unique asset is the corpus of approved workflows it accumulates across every client. Training is generic; an approved workflow that already runs inside this specific org is the highest-converting learning material that exists. It also shortens the loop: employees build fewer redundant workflows and copy what demonstrably works.

### Tool 4 (bonus) — Skill Staleness Trigger

**What it does:** AI changes fast; someone trained six months ago is quietly out of date. This monitors when an employee's learned workflow (and its dependencies) drifts from current tool/model capabilities, and re-triggers a short, targeted tutor session.

**Who it is for:** Employees; L&D admins who own the pathway content.

**Why it is valuable:** Training decay is invisible and compounding. Keeping pathways live instead of one-shot closes the "we already did training" objection at renewal.

---

## 2. How I would build them

**Stack:** One Next.js 15 App Router app (TypeScript, Tailwind), four tools as modules under one shared design system, one deployable unit. This matches TAI's constraint — the tools must read as modules of one product suite — and keeps the AI-calling surface in one place: `lib/ai.ts`, a single wrapper every route uses.

**Data:** For the prototype, typed in-memory seed stores — one folder per tool under `lib/tools/<tool>/` (`schema.ts` + `store.ts`). This is a deliberate, interview-defensible choice: the demo must run with zero setup beyond one env var, the whole "database" is readable as small seed files, and durability across restarts buys nothing in a demo. In production, the heartbeat telemetry is an append-only event stream in Postgres (Supabase) — each run is an event; weekly run counts are a rollup view. The score functions would be identical, just reading from a rollup table instead of an in-memory array. I chose Postgres over a document store because adoption reports are fundamentally aggregates (counts, sums, trends), which is what SQL does well.

**Models:** Gemini 2.5 Flash via the Vercel AI SDK's `generateObject` with a Zod schema per tool — the functional equivalent of forced tool-use / strict JSON output. The model ID is env-configurable (`GOOGLE_MODEL`), so it swaps without code changes. Why Flash over a larger model: these judgment tasks are bounded (classify, extract, explain, recommend) — bounded tasks are exactly what a fast, cheap model is for, and at org scale the per-call cost and latency matter more than marginal quality. Why Gemini overall: strong structured-output support, competitive pricing, and the provider swap is a one-line change — which is the point of isolating AI behind one wrapper.

**A key design principle:** *arithmetic in code, judgment in AI.* Scores, rankings, and aggregates are computed deterministically in plain code so they are reproducible and auditable — an executive must be able to see exactly why a workflow scored 62, and two different people looking at the same telemetry must get the same number. The AI is used only where judgment is required: explaining *why* a number looks the way it does, and recommending *what to do*. This is the difference between a product feature and a chat wrapper.

---

## 3. How I would deploy them

**Hosting:** Vercel — one project, zero infrastructure. Server components render the dashboards; the API routes are serverless functions; the heartbeat endpoint is a single POST route. Vercel's free/hobby tier is sufficient for a demo; the $20 Pro tier covers a production demo.

**Cost:** Negligible. Vercel hosting is free-tier-viable, and Gemini 2.5 Flash pricing is well under a cent per analysis call. Even at thousands of workflows analyzed weekly, this stays in the single digits of dollars per month per client.

**Reliability:** Three layers. (1) Every AI-calling route validates output against its Zod schema and returns a typed JSON error (missing key vs schema failure) — a route never crashes, and the UI always renders a readable error banner instead of a blank screen. (2) The deterministic parts (scores, aggregates) don't call the AI at all, so the dashboard works even if the model is down. (3) State is in-memory for the demo but the production migration path is documented — Postgres for telemetry, a cron/edge job for weekly rollups. The heartbeat endpoint is idempotent-friendly (each run is an event) so replays and retries are safe.

**How I know it works:** A build gate (`npm run build`), a typed seed-data walk (each tool has seed records covering every outcome class), and the error-path checks (run with the key unset, confirm the banner, not a crash). At product level, the tool measures itself: the KPI is the org's average adoption score and its trend across clients — if the loop works, the numbers the tool produces are the proof.

---

## 4. Which idea is genuinely novel

**The Adoption Evidence Engine — applied at the workflow level, in an AI-upskilling context.**

I want to be precise about the claim. Software-adoption measurement is a real market: WalkMe, Whatfix, and Pendo measure whether people use software. Shadow-AI discovery and AI review copilots are increasingly crowded. What is *not* on the market is a system that measures whether **employee-built AI workflows** actually change the work — because that measurement requires holding the entire loop: the diagnosis, the training, the workflow the employee built, the manager's approval, and the ongoing telemetry. Only a player with that loop — that is, only TAI — has the ground truth to make the measurement meaningful.

The novelty is structural, not cosmetic: TAI already owns every data point the tool needs; it just isn't collecting the heartbeat. The instrument turns TAI's own loop into its measurement apparatus — "prove it made a difference" stops being a marketing line and becomes a report that an executive, a manager, and an employee can each read. That is the strongest possible answer to "why TAI, and why now."
