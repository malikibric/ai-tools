# Build Prompt for Opus — TAI Labs Assessment: 3 New Tool Prototypes

Paste everything below into Claude Code / Opus as-is.

---

## Context

I'm doing a take-home assessment for a Product/GTM Engineer Intern role at TAI Labs. TAI Labs sells AI-workforce-transformation software on two plans, so you are going to help me:

- **TAI Workforce** (self-serve, ~$499/employee/year): diagnoses each employee's role + AI capability, generates a personalized learning pathway, teaches with a role-aware AI tutor, and makes each person build a real workflow their manager approves.
- **TAI Enablement** (from ~$3,750/month): adds a company workspace, org-wide workflow discovery, an internal approved-workflow library, executive accountability, and measured adoption/ROI.

Their pitch: "You've already bought AI tools — TAI makes sure the work actually changes." The core loop is: **diagnose → personalized pathway → AI tutor → employee builds workflow → manager approves → adoption gets measured.**

I now need **three additional working prototypes** that plug real gaps in TAI's existing loop — none of these exist in their current product.

**Hard constraints:**
- No n8n, no Zapier-style glue, no generic "automation toolkit" template. Everything is a real, purpose-built app.
- Match the existing stack and design system exactly so all four tools feel like one coherent product suite.
- Each tool needs real (if minimal) backend logic — not a static mockup. Use the Anthropic API with forced tool-use / structured output wherever the tool needs to reason over text.
- Ship something that actually runs (`npm run build` passes) with realistic seed/sample data, so each tool is demoable with zero setup beyond an API key.
- I need to be able to explain every architecture choice in an interview, so keep the code readable and the data model obvious — no cleverness for its own sake.

---

## Build these three tools

### 1. Workflow Drift Monitor
**Problem it solves:** TAI measures workflow adoption once, at ship time. Nobody tracks whether an approved workflow still works six months later — the API it calls changed, the tool it depends on got deprecated, the person who built it left. Value silently decays and nobody notices.

**Core flow:**
- A seeded list of "approved workflows" in the org library, each with: name, owner, description, the tools/APIs/systems it depends on, date approved, last verified date.
- A "Run Health Check" action that takes each workflow's description + dependencies and asks Claude (forced tool-use, structured JSON output) to assess drift risk: has anything in the dependency list likely changed, is the workflow description internally consistent with how it's described as still being used, what's the risk level (healthy / at-risk / broken), and a one-line suggested next action.
- A dashboard view: workflows grouped by risk level, with a detail panel per workflow showing the model's reasoning and suggested fix.
- Seed data should include at least one workflow that's clearly still healthy, one at-risk, and one clearly broken (e.g. depends on a deprecated API), so the demo shows range.

### 2. Manager Review Copilot
**Problem it solves:** In TAI's loop, a manager has to approve each employee-submitted workflow — but most managers aren't AI-literate enough to judge whether a workflow is actually good, safe, or worth the claimed time savings. Today that's a rubber stamp.

**Core flow:**
- An employee submits a workflow: what it does, what tool/prompt/process it uses, claimed time saved per week, what data it touches.
- The system (Claude, forced tool-use) generates a structured **review brief** for the manager: 3-5 specific questions the manager should ask the employee, any risk flags (e.g. sensitive data handling, over-claimed time savings, no fallback if the AI is wrong), a plain-language explanation of what the workflow actually does, and a recommendation (approve / approve with changes / needs discussion) with reasoning.
- Manager-facing UI: submission on one side, generated review brief on the other, with an approve/reject/request-changes action that's just a state change (no need for real auth/persistence beyond in-memory or Supabase row update).
- Seed 2-3 example submissions of varying quality so the review brief's judgment is visibly different across them.

### 3. Shadow AI Discovery Scanner
**Problem it solves:** TAI's diagnostic step assumes it's starting from a blank slate, but employees are already using AI tools informally, unsanctioned, and inconsistently before any training program starts. The enablement program is being designed on guesses instead of what's actually happening.

**Core flow:**
- A short, low-friction survey: a handful of open-ended questions like "what AI tools have you used at work in the last month, for what, and how" — free text, not a rigid form.
- Claude (forced tool-use, structured JSON output) processes each response into: tools mentioned, use-case category, an informal-usage risk flag (e.g. sensitive data pasted into a consumer tool, no oversight), and a one-line summary.
- An aggregate view across all responses: most common tools in informal use, most common use cases, and a ranked list of risk flags — this is the artifact that would actually inform how TAI designs a client's rollout.
- Seed 6-8 varied survey responses (some benign, at least one or two with a real risk flag like pasting client data into a personal ChatGPT account) so the aggregate view has something meaningful to show.

---

## Technical approach

- **Framework:** Next.js (App Router), same major version as the existing prototype.
- **Data:** Supabase/Postgres if straightforward to seed, otherwise a typed in-memory/JSON seed store is fine for a demo-grade prototype — pick whichever is faster to ship cleanly and be ready to justify the choice.
- **AI calls:** Anthropic API, Claude Sonnet, forced tool-use with a strict JSON schema per tool (`emit_drift_assessment`, `emit_review_brief`, `emit_survey_analysis` or similar) so responses are always valid, structured data — never freeform text parsing.
- **Structure:** One deployable app with a simple landing page linking to all three tools (and ideally the existing Auto-Debrief tool too, if convenient) as a mini-suite — three tools that look like modules of one product, not three disconnected demos.
- **Design system:** Reuse the dark navy + amber palette, Space Grotesk / Inter / IBM Plex Mono fonts, and general layout language from the existing prototype exactly.
- **Error handling:** Every AI-calling route needs a clean fallback if the API key is missing or the model output fails schema validation — return a clear error state in the UI, never a crash.
- **Deployment:** Should build cleanly (`npm run build`) and be ready to deploy to Vercel with a single `ANTHROPIC_API_KEY` env var (plus Supabase env vars if used).

## What to hand back when done

1. Working code for all three tools, structured as routes/modules in one app.
2. A short README section per tool: what it does, why it's architected this way, what you'd do differently with more time.
3. Confirmation that `npm run build` passes and that each tool has been sanity-checked with its seed data.
4. A 2-3 sentence "why this is valuable to TAI's clients" blurb per tool, written for a non-technical reader — I'll use these directly in my written assessment answers.