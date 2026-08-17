# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

A working Next.js app (App Router) implementing four prototype tools for the TAI Labs take-home assessment (Product/GTM Engineer Intern). The assessment has two parts: Part 1 (written answers — see `docs/assessment-part1-answers.md`) and Part 2 (working prototype). The four tools plug gaps in TAI Labs' product loop (diagnose → personalized pathway → AI tutor → employee builds workflow → manager approves → adoption measured) and read as modules of one coherent product suite from the landing page.

1. **Adoption Evidence Engine** (`/adoption-evidence`) — the flagship, built for Part 2. Instrumented workflows phone home with heartbeats; the score (0-100, four levels) is computed deterministically in code; Gemini produces a structured diagnosis + intervention via forced schema. Includes a real telemetry-ingestion endpoint (`POST /api/adoption-evidence/heartbeat`).
2. **Workflow Drift Monitor** (`/drift-monitor`) — health checks on approved workflows; Gemini classifies healthy/at-risk/broken with reasoning.
3. **Manager Review Copilot** (`/review-copilot`) — generates a manager-facing review brief for employee workflow submissions; approve/reject is a state change.
4. **Shadow AI Discovery Scanner** (`/shadow-scanner`, `/shadow-scanner/aggregate`) — free-text survey on informal AI usage; Gemini extracts tools/use-cases/risk flags; aggregate view is plain JS over the structured analyses.

## Commands

- `npm run dev` — dev server.
- `npm run build` — production build (must pass before shipping).
- `npm run typecheck` — `tsc --noEmit`.

## Architecture constraints (non-negotiable)

- **Framework:** Next.js App Router + TypeScript + Tailwind (dark navy + amber palette, Space Grotesk / Inter / IBM Plex Mono fonts via `lib/globals.css` tokens and `app/layout.tsx`).
- **AI calls:** Gemini via Vercel AI SDK `generateObject` + a Zod schema per tool (the functional equivalent of forced tool-use / strict JSON output). The single wrapper is `lib/ai.ts` (`callStructured`, `classifyError`). Never parse freeform text; every AI-calling route must return a typed error state (`missing_api_key` | `ai_call_failed`, HTTP 502) if the key is missing or output fails validation — never crash.
- **Env vars:** `GOOGLE_API_KEY` (required for AI paths), optional `GOOGLE_MODEL` (default `gemini-2.5-flash`). See `.env.example`.
- **Data:** typed in-memory seed stores under `lib/store/` (no DB). Each store's seed data must show a range of outcomes (e.g. adoption evidence has one workflow per level: strong/slipping/at-risk/stalled; drift monitor has healthy/at-risk/broken; shadow scanner has 8 responses with ≥1 real risk flag).
- **Design principle:** *arithmetic in code, judgment in AI.* Scores, counts, and aggregates must be deterministic (reproducible, auditable); AI is only for explanation and recommendation. Each tool's Zod schema doubles as its TS type.
- **Demoability:** `npm run build` must pass; each tool demoable with zero setup beyond `GOOGLE_API_KEY`. UI follows the existing design language exactly (cards, `font-mono` uppercase micro-labels, amber accent buttons, level pills).
