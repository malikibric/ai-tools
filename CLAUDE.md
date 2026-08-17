# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

This repo currently contains only `prompt.md` — a build spec for a take-home assessment (Product/GTM Engineer Intern, TAI Labs). No code exists yet. This CLAUDE.md is forward-looking: it documents the target architecture from `prompt.md` so implementation stays consistent. Update this file once real code lands (commands, actual file layout, etc. should replace the placeholders below).

## What's being built

One Next.js app (App Router) housing three new prototype tools that plug gaps in TAI Labs' existing product loop (diagnose → personalized pathway → AI tutor → employee builds workflow → manager approves → adoption measured). The three tools should read as modules of one coherent product suite, linked from a shared landing page alongside the existing "Auto-Debrief" tool if convenient.

1. **Workflow Drift Monitor** — seeded approved-workflow library; "Run Health Check" sends each workflow's description + dependencies to Claude (forced tool-use → `emit_drift_assessment`) to classify risk (healthy / at-risk / broken) with reasoning and a suggested next action. Dashboard grouped by risk level.
2. **Manager Review Copilot** — employee submits a workflow (what it does, tool/prompt/process, claimed time saved, data touched); Claude (forced tool-use → `emit_review_brief`) generates manager-facing questions, risk flags, a plain-language explanation, and an approve/approve-with-changes/needs-discussion recommendation. Manager UI: submission + generated brief side by side, with an approve/reject/request-changes state change.
3. **Shadow AI Discovery Scanner** — free-text survey on informal AI tool usage; Claude (forced tool-use → `emit_survey_analysis`) extracts tools mentioned, use-case category, informal-usage risk flag, and a one-line summary per response. Aggregate view: common tools, common use cases, ranked risk flags.

Full requirements, seed data expectations, and hard constraints (no n8n/Zapier-style glue, match existing design system exactly, real backend logic not static mockups) are in `prompt.md` — read it before starting implementation.

## Architecture constraints (from prompt.md — non-negotiable)

- **Framework:** Next.js App Router, same major version as the existing TAI prototype this suite extends.
- **AI calls:** Anthropic API, Claude Sonnet, **forced tool-use with a strict JSON schema per tool** (`emit_drift_assessment`, `emit_review_brief`, `emit_survey_analysis`). Never parse freeform text — every AI-calling route must validate against its schema and return a clean error state (not a crash) if the API key is missing or output fails validation.
- **Data:** Supabase/Postgres if straightforward to seed, otherwise a typed in-memory/JSON seed store — pick whichever ships cleanly, and be ready to justify the choice in the README.
- **Design system:** Reuse the existing prototype's dark navy + amber palette, Space Grotesk / Inter / IBM Plex Mono fonts, and layout language exactly — these three tools must look like they belong to the same product as the existing one, not a fresh design.
- **Demoability:** `npm run build` must pass, and each tool must be demoable with zero setup beyond an `ANTHROPIC_API_KEY` env var (plus Supabase env vars if that path is chosen). Seed data must show a range of outcomes (e.g. drift monitor needs one healthy / one at-risk / one broken workflow; survey scanner needs 6-8 varied responses including at least one real risk flag).
- **Code quality bar:** Every architecture choice needs to be explainable in an interview — keep code readable and the data model obvious, no cleverness for its own sake.

## Deliverables checklist (from prompt.md)

1. Working code for all three tools as routes/modules in one app.
2. A short README section per tool: what it does, why it's architected this way, what you'd do differently with more time.
3. Confirmation `npm run build` passes and each tool has been sanity-checked against its seed data.
4. A 2-3 sentence non-technical "why this is valuable to TAI's clients" blurb per tool.
