# TAI Labs Tool Prototypes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single Next.js app containing three AI-backed tool prototypes (Workflow Drift Monitor, Manager Review Copilot, Shadow AI Discovery Scanner) for a TAI Labs take-home assessment, matching the design spec at `docs/superpowers/specs/2026-08-17-tai-tools-design.md`.

**Architecture:** Next.js 15 App Router + TypeScript, feature-folder per tool (`app/<tool>/page.tsx` + `app/api/<tool>/route.ts`), shared design tokens/UI/AI-wrapper/schemas/stores under `lib/`. In-memory module-level stores seeded at import time — no database. Each AI-calling route forces structured output via the Vercel AI SDK's `generateObject` against a Zod schema that doubles as the route's TypeScript type.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 3.4, Zod 3, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), Claude Sonnet 5 (`claude-sonnet-5`).

## Global Constraints

- Framework: Next.js 15 App Router + TypeScript (per spec Architecture section).
- Backend mechanism: Route Handlers (`app/api/**/route.ts`) for every AI-calling operation — not Server Actions (per spec's explicit choice).
- Data layer: in-memory, module-level arrays seeded at import time — no Supabase/Postgres (per spec's explicit choice).
- AI calls: Vercel AI SDK `generateObject` with a Zod schema per tool, forcing structured output — never freeform text parsing (per spec).
- One Zod schema per tool serves as both the forced-output schema and the TS type — no separate parsing/mapping layer (per spec Data model section).
- Styling: Tailwind CSS with dark-navy + amber palette and Space Grotesk / Inter / IBM Plex Mono fonts, defined once as tokens and reused across all three tools (per spec).
- Landing page indexes only the 3 new tools — no Auto-Debrief placeholder (per spec's confirmed scope resolution).
- Error handling: every AI-calling route returns a typed JSON error (`{ error: { kind, message } }`, status 502) on missing API key or schema-validation failure — never a crash (per spec).
- No automated test suite. Verification = `npm run build` / `npm run typecheck` passing, plus manual exercise of each tool's seed-data path and an unset-`ANTHROPIC_API_KEY` check (per spec's Testing/verification section — this is a deliberate, approved deviation from this skill's default TDD step pattern).
- Deliverables (per spec checklist): working code for all 3 tools; a README section per tool (what/why/what-you'd-do-differently); confirmation `npm run build` passes and each tool is sanity-checked; a 2-3 sentence non-technical "why valuable to TAI's clients" blurb per tool.

---

### Task 1: Project scaffold

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a buildable Next.js App Router skeleton. Tailwind color tokens (`bg`, `surface`, `border`, `text`, `text-muted`, `amber`, `amber-soft`, `healthy`, `at-risk`, `broken`) and font tokens (`font-display`, `font-body`, `font-mono`) usable as Tailwind classes in every later task. `RootLayout` wraps all pages with the font variables and base background/text color applied to `<body>`.

- [ ] **Step 1: Write `.gitignore`**

```
node_modules
.next
.env
.env.local
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "tai-tools",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ai": "^4.0.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 5: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

- [ ] **Step 6: Write `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Write `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        amber: "var(--color-amber)",
        "amber-soft": "var(--color-amber-soft)",
        healthy: "var(--color-healthy)",
        "at-risk": "var(--color-at-risk)",
        broken: "var(--color-broken)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 8: Write `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: #0b1120;
  --color-surface: #111a2e;
  --color-border: #1f2b45;
  --color-text: #e8ecf5;
  --color-text-muted: #93a0bf;
  --color-amber: #f5a524;
  --color-amber-soft: #f5a52426;
  --color-healthy: #34d399;
  --color-at-risk: #f5a524;
  --color-broken: #f87171;
}
```

- [ ] **Step 9: Write `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TAI Labs — Prototype Suite",
  description: "Workflow Drift Monitor, Manager Review Copilot, and Shadow AI Discovery Scanner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="bg-bg font-body text-text antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Write `app/page.tsx` (temporary placeholder, replaced in Task 2)**

```tsx
export default function HomePage() {
  return (
    <main className="p-10 text-text">
      <h1 className="font-display text-2xl">TAI Labs Prototype Suite</h1>
    </main>
  );
}
```

- [ ] **Step 11: Install dependencies and verify the build**

Run: `npm install && npm run build`
Expected: build completes successfully, producing a static/prerendered `/` route with no errors.

- [ ] **Step 12: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts postcss.config.js tailwind.config.ts app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: scaffold Next.js app with design tokens"
```

---

### Task 2: Shared UI components + landing page

**Files:**
- Create: `lib/ui/Card.tsx`
- Create: `lib/ui/Badge.tsx`
- Create: `lib/ui/RiskPill.tsx`
- Create: `lib/ui/PageShell.tsx`
- Modify: `app/page.tsx` (replace Task 1's placeholder)

**Interfaces:**
- Consumes: Tailwind tokens from Task 1 (`bg`, `surface`, `border`, `text`, `text-muted`, `amber`, `amber-soft`, `healthy`, `at-risk`, `broken`, `font-display`, `font-mono`).
- Produces: `Card({ children, className? })`, `Badge({ children })`, `RiskPill({ level: "healthy" | "at_risk" | "broken" })`, `PageShell({ title, description, children })` from `lib/ui/*` — used by every tool page from Task 6 onward.

- [ ] **Step 1: Write `lib/ui/Card.tsx`**

```tsx
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-surface p-5 ${className}`}>{children}</div>;
}
```

- [ ] **Step 2: Write `lib/ui/Badge.tsx`**

```tsx
import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-amber-soft px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide text-amber">
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Write `lib/ui/RiskPill.tsx`**

```tsx
type RiskLevel = "healthy" | "at_risk" | "broken";

const LABELS: Record<RiskLevel, string> = {
  healthy: "Healthy",
  at_risk: "At Risk",
  broken: "Broken",
};

const COLORS: Record<RiskLevel, string> = {
  healthy: "bg-healthy/15 text-healthy",
  at_risk: "bg-at-risk/15 text-at-risk",
  broken: "bg-broken/15 text-broken",
};

export function RiskPill({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide ${COLORS[level]}`}>
      {LABELS[level]}
    </span>
  );
}
```

- [ ] **Step 4: Write `lib/ui/PageShell.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <Link href="/" className="font-mono text-xs uppercase tracking-wide text-text-muted hover:text-amber">
        &larr; TAI Suite
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-text">{title}</h1>
      <p className="mt-2 max-w-2xl text-text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 5: Replace `app/page.tsx` with the real landing page**

```tsx
import Link from "next/link";
import { Card } from "@/lib/ui/Card";

const TOOLS = [
  {
    href: "/drift-monitor",
    name: "Workflow Drift Monitor",
    description: "Flags approved workflows whose dependencies or behavior have likely drifted since approval.",
  },
  {
    href: "/review-copilot",
    name: "Manager Review Copilot",
    description: "Turns a raw employee workflow submission into a structured brief a manager can act on.",
  },
  {
    href: "/shadow-scanner",
    name: "Shadow AI Discovery Scanner",
    description: "Surveys informal AI usage and aggregates it into a rollout-planning artifact.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-amber">TAI Labs Prototype Suite</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-text">Three tools for the enablement loop.</h1>
      <p className="mt-3 max-w-2xl text-text-muted">
        Diagnose, teach, build, approve, measure — these three prototypes plug the gaps between shipping a workflow
        and knowing it still works.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="h-full transition hover:border-amber">
              <h2 className="font-display text-lg font-semibold text-text">{tool.name}</h2>
              <p className="mt-2 text-sm text-text-muted">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: build passes with no type or lint errors.

- [ ] **Step 7: Commit**

```bash
git add lib/ui app/page.tsx
git commit -m "feat: add shared UI components and landing page"
```

---

### Task 3: AI call wrapper

**Files:**
- Create: `lib/ai.ts`
- Create: `.env.example`

**Interfaces:**
- Consumes: `ANTHROPIC_API_KEY` env var; `ai` and `@ai-sdk/anthropic` packages from Task 1.
- Produces: `callStructured<T>(schema: ZodSchema<T>, prompt: string): Promise<T>`, `classifyError(error: unknown): { kind: "missing_api_key" | "ai_call_failed"; message: string }`, `MissingApiKeyError`, `AICallError` from `lib/ai.ts` — used by every route handler from Task 6 onward.

- [ ] **Step 1: Write `lib/ai.ts`**

```ts
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { ZodSchema } from "zod";

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set.");
    this.name = "MissingApiKeyError";
  }
}

export class AICallError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AICallError";
  }
}

const MODEL_ID = "claude-sonnet-5";

export async function callStructured<T>(schema: ZodSchema<T>, prompt: string): Promise<T> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingApiKeyError();
  }

  try {
    const { object } = await generateObject({
      model: anthropic(MODEL_ID),
      schema,
      prompt,
    });
    return object;
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      throw error;
    }
    throw new AICallError(
      "The model call failed or returned output that didn't match the expected schema.",
      error
    );
  }
}

export type StructuredCallErrorKind = "missing_api_key" | "ai_call_failed";

export function classifyError(error: unknown): { kind: StructuredCallErrorKind; message: string } {
  if (error instanceof MissingApiKeyError) {
    return { kind: "missing_api_key", message: "AI service unavailable — ANTHROPIC_API_KEY is not set." };
  }
  return { kind: "ai_call_failed", message: "Model returned unexpected output, try again." };
}
```

- [ ] **Step 2: Write `.env.example`**

```
ANTHROPIC_API_KEY=
```

- [ ] **Step 3: Verify types**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/ai.ts .env.example
git commit -m "feat: add forced structured-output AI call wrapper"
```

---

### Task 4: Zod schemas

**Files:**
- Create: `lib/schemas/drift-assessment.ts`
- Create: `lib/schemas/review-brief.ts`
- Create: `lib/schemas/survey-analysis.ts`

**Interfaces:**
- Consumes: `zod` package from Task 1.
- Produces: `DriftAssessmentSchema` / `DriftAssessment` type, `ReviewBriefSchema` / `ReviewBrief` type, `SurveyAnalysisSchema` / `SurveyAnalysis` type — consumed by `lib/store/*` (Task 5) and every route handler (Tasks 6-8).

- [ ] **Step 1: Write `lib/schemas/drift-assessment.ts`**

```ts
import { z } from "zod";

export const DriftAssessmentSchema = z.object({
  riskLevel: z.enum(["healthy", "at_risk", "broken"]),
  dependencyChangeLikelihood: z.string(),
  descriptionConsistency: z.string(),
  suggestedNextAction: z.string(),
});

export type DriftAssessment = z.infer<typeof DriftAssessmentSchema>;
```

- [ ] **Step 2: Write `lib/schemas/review-brief.ts`**

```ts
import { z } from "zod";

export const ReviewBriefSchema = z.object({
  plainLanguageExplanation: z.string(),
  managerQuestions: z.array(z.string()).min(3).max(5),
  riskFlags: z.array(z.string()),
  recommendation: z.enum(["approve", "approve_with_changes", "needs_discussion"]),
  recommendationReasoning: z.string(),
});

export type ReviewBrief = z.infer<typeof ReviewBriefSchema>;
```

- [ ] **Step 3: Write `lib/schemas/survey-analysis.ts`**

```ts
import { z } from "zod";

export const SurveyAnalysisSchema = z.object({
  toolsMentioned: z.array(z.string()),
  useCaseCategory: z.string(),
  riskFlag: z.string().nullable(),
  summary: z.string(),
});

export type SurveyAnalysis = z.infer<typeof SurveyAnalysisSchema>;
```

- [ ] **Step 4: Verify types**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/schemas
git commit -m "feat: add forced tool-use schemas for the three tools"
```

---

### Task 5: In-memory stores with seed data

**Files:**
- Create: `lib/store/workflows.ts`
- Create: `lib/store/submissions.ts`
- Create: `lib/store/survey-responses.ts`

**Interfaces:**
- Consumes: `DriftAssessment` type (Task 4) in `workflows.ts`; `ReviewBrief` type (Task 4) in `submissions.ts`; `SurveyAnalysis` type (Task 4) in `survey-responses.ts`.
- Produces:
  - `lib/store/workflows.ts`: `Workflow` type, `getWorkflows(): Workflow[]`, `getWorkflowById(id: string): Workflow | undefined`, `updateWorkflowAssessment(id: string, assessment: DriftAssessment): Workflow | undefined`.
  - `lib/store/submissions.ts`: `Submission` type, `SubmissionStatus` type, `getSubmissions(): Submission[]`, `getSubmissionById(id: string): Submission | undefined`, `addSubmission(input): Submission`, `setSubmissionBrief(id, brief): Submission | undefined`, `setSubmissionStatus(id, status): Submission | undefined`.
  - `lib/store/survey-responses.ts`: `SurveyResponse` type, `getSurveyResponses(): SurveyResponse[]`, `addSurveyResponse(answers): SurveyResponse`, `setSurveyResponseAnalysis(id, analysis): SurveyResponse | undefined`.
  - Consumed by every route handler and page from Task 6 onward.

- [ ] **Step 1: Write `lib/store/workflows.ts`**

```ts
import type { DriftAssessment } from "@/lib/schemas/drift-assessment";

export type Workflow = {
  id: string;
  name: string;
  owner: string;
  description: string;
  dependencies: string[];
  dateApproved: string;
  lastVerified: string;
  assessment: DriftAssessment | null;
};

let workflows: Workflow[] = [
  {
    id: "wf-1",
    name: "Weekly Support Ticket Triage",
    owner: "Priya Nandakumar",
    description:
      "Every Monday, pulls the previous week's support tickets from the internal ticket export, classifies each by urgency and topic, and posts a summary to the #support-ops Slack channel. Still runs exactly as documented; the team references the summary every week.",
    dependencies: ["Internal ticket CSV export (unchanged format since 2024)", "Slack webhook to #support-ops"],
    dateApproved: "2025-11-03",
    lastVerified: "2026-07-20",
    assessment: null,
  },
  {
    id: "wf-2",
    name: "Competitor Pricing Digest",
    owner: "Marcus Webb",
    description:
      "Scrapes three competitor pricing pages weekly and drafts a comparison doc. The team mentioned recently that the digest 'looks a little empty lately' but nobody has looked into why.",
    dependencies: [
      "Competitor pricing page scraper (one competitor redesigned their pricing page last quarter)",
      "Google Docs API for the comparison doc",
    ],
    dateApproved: "2025-09-15",
    lastVerified: "2026-02-01",
    assessment: null,
  },
  {
    id: "wf-3",
    name: "Legacy Invoice Summarizer",
    owner: "Dana Ruiz",
    description:
      "Summarizes incoming vendor invoices using the AcmeInvoice v1 API and emails the summary to accounts payable. AcmeInvoice v1 was formally deprecated and shut off; the workflow has not been updated since.",
    dependencies: ["AcmeInvoice API v1 (deprecated, shut down)", "Internal email relay"],
    dateApproved: "2025-06-10",
    lastVerified: "2025-06-10",
    assessment: null,
  },
];

export function getWorkflows(): Workflow[] {
  return workflows;
}

export function getWorkflowById(id: string): Workflow | undefined {
  return workflows.find((w) => w.id === id);
}

export function updateWorkflowAssessment(id: string, assessment: DriftAssessment): Workflow | undefined {
  const workflow = getWorkflowById(id);
  if (!workflow) return undefined;
  workflow.assessment = assessment;
  return workflow;
}
```

- [ ] **Step 2: Write `lib/store/submissions.ts`**

```ts
import type { ReviewBrief } from "@/lib/schemas/review-brief";

export type SubmissionStatus = "pending" | "approved" | "approved_with_changes" | "rejected";

export type Submission = {
  id: string;
  employeeName: string;
  whatItDoes: string;
  toolOrPromptUsed: string;
  claimedTimeSavedPerWeek: string;
  dataTouched: string;
  status: SubmissionStatus;
  brief: ReviewBrief | null;
};

let submissions: Submission[] = [
  {
    id: "sub-1",
    employeeName: "Ilhan Bajric",
    whatItDoes:
      "Drafts first-pass replies to routine internal IT help-desk tickets (password resets, VPN access requests) so the on-call IT person can review and send instead of writing from scratch.",
    toolOrPromptUsed: "A saved prompt template in the team's Claude workspace, run manually by pasting in the ticket text.",
    claimedTimeSavedPerWeek: "About 2 hours a week, based on roughly 15 tickets at 8 minutes saved each.",
    dataTouched: "Ticket text only — employee name and request type, no credentials or customer data.",
    status: "pending",
    brief: null,
  },
  {
    id: "sub-2",
    employeeName: "Renee Castillo",
    whatItDoes:
      "Auto-generates full customer follow-up emails after every sales call and sends them without review, based on call notes.",
    toolOrPromptUsed: "A no-code AI email tool connected directly to the CRM's send action.",
    claimedTimeSavedPerWeek: "Claims 10 hours a week saved across the team — every follow-up email, fully automated, zero manual review.",
    dataTouched: "Full CRM records: customer names, deal values, and call notes.",
    status: "pending",
    brief: null,
  },
  {
    id: "sub-3",
    employeeName: "Owen Park",
    whatItDoes:
      "Summarizes uploaded vendor contracts, including payment terms and termination clauses, using a free consumer AI chatbot account so the team can skim faster before legal review.",
    toolOrPromptUsed: "A personal account on a free public AI chatbot, contracts pasted in as plain text.",
    claimedTimeSavedPerWeek: "Roughly 3 hours a week across the team.",
    dataTouched: "Full vendor contracts, including payment terms and any client names mentioned in them.",
    status: "pending",
    brief: null,
  },
];

export function getSubmissions(): Submission[] {
  return submissions;
}

export function getSubmissionById(id: string): Submission | undefined {
  return submissions.find((s) => s.id === id);
}

export function addSubmission(input: Omit<Submission, "id" | "status" | "brief">): Submission {
  const submission: Submission = {
    ...input,
    id: `sub-${submissions.length + 1}`,
    status: "pending",
    brief: null,
  };
  submissions.push(submission);
  return submission;
}

export function setSubmissionBrief(id: string, brief: ReviewBrief): Submission | undefined {
  const submission = getSubmissionById(id);
  if (!submission) return undefined;
  submission.brief = brief;
  return submission;
}

export function setSubmissionStatus(id: string, status: SubmissionStatus): Submission | undefined {
  const submission = getSubmissionById(id);
  if (!submission) return undefined;
  submission.status = status;
  return submission;
}
```

- [ ] **Step 3: Write `lib/store/survey-responses.ts`**

```ts
import type { SurveyAnalysis } from "@/lib/schemas/survey-analysis";

export type SurveyResponse = {
  id: string;
  answers: {
    toolsUsed: string;
    whatFor: string;
    howOften: string;
  };
  analysis: SurveyAnalysis | null;
};

let surveyResponses: SurveyResponse[] = [
  {
    id: "resp-1",
    answers: {
      toolsUsed: "ChatGPT (company account)",
      whatFor: "Drafting internal announcement emails and cleaning up meeting notes.",
      howOften: "A few times a week.",
    },
    analysis: {
      toolsMentioned: ["ChatGPT"],
      useCaseCategory: "Internal communications",
      riskFlag: null,
      summary: "Uses company ChatGPT account for internal writing tasks; no sensitive data involved.",
    },
  },
  {
    id: "resp-2",
    answers: {
      toolsUsed: "GitHub Copilot",
      whatFor: "Autocompleting boilerplate code while building internal tools.",
      howOften: "Daily.",
    },
    analysis: {
      toolsMentioned: ["GitHub Copilot"],
      useCaseCategory: "Software development",
      riskFlag: null,
      summary: "Standard IDE-integrated code completion for internal tooling work.",
    },
  },
  {
    id: "resp-3",
    answers: {
      toolsUsed: "Personal ChatGPT account",
      whatFor: "Pasting client contract excerpts in to get a plain-English summary before client calls.",
      howOften: "Two or three times a week.",
    },
    analysis: {
      toolsMentioned: ["ChatGPT (personal account)"],
      useCaseCategory: "Client document review",
      riskFlag: "Client contract data pasted into a personal (non-company) AI account.",
      summary: "Summarizes client contracts via a personal ChatGPT account ahead of client calls.",
    },
  },
  {
    id: "resp-4",
    answers: {
      toolsUsed: "Midjourney",
      whatFor: "Generating rough concept images for internal slide decks.",
      howOften: "Once or twice a month.",
    },
    analysis: {
      toolsMentioned: ["Midjourney"],
      useCaseCategory: "Presentation design",
      riskFlag: null,
      summary: "Occasional use of Midjourney for non-sensitive internal presentation visuals.",
    },
  },
  {
    id: "resp-5",
    answers: {
      toolsUsed: "A free budgeting chatbot app found online",
      whatFor:
        "Uploading department budget spreadsheets to get quick variance summaries, since finance's own tooling is slow.",
      howOften: "Weekly, before the department budget review.",
    },
    analysis: {
      toolsMentioned: ["Unnamed free budgeting chatbot app"],
      useCaseCategory: "Financial reporting",
      riskFlag: "Department financial data uploaded to an unvetted third-party tool with no IT oversight.",
      summary: "Uploads budget spreadsheets to an unvetted external chatbot for weekly variance summaries.",
    },
  },
  {
    id: "resp-6",
    answers: {
      toolsUsed: "Claude (company account)",
      whatFor: "Brainstorming outlines for training materials.",
      howOften: "A few times a month.",
    },
    analysis: {
      toolsMentioned: ["Claude"],
      useCaseCategory: "Training content creation",
      riskFlag: null,
      summary: "Uses company Claude account to outline training materials; no sensitive data.",
    },
  },
  {
    id: "resp-7",
    answers: {
      toolsUsed: "Grammarly, ChatGPT (company account)",
      whatFor: "Proofreading external emails and rephrasing awkward sentences.",
      howOften: "Daily.",
    },
    analysis: {
      toolsMentioned: ["Grammarly", "ChatGPT"],
      useCaseCategory: "Writing assistance",
      riskFlag: null,
      summary: "Daily use of writing-assistance tools for proofreading outgoing emails.",
    },
  },
  {
    id: "resp-8",
    answers: {
      toolsUsed: "ChatGPT (company account)",
      whatFor: "Summarizing long internal Slack threads before status meetings.",
      howOften: "A couple times a week.",
    },
    analysis: {
      toolsMentioned: ["ChatGPT"],
      useCaseCategory: "Internal communications",
      riskFlag: null,
      summary: "Summarizes internal Slack threads ahead of status meetings using the company ChatGPT account.",
    },
  },
];

export function getSurveyResponses(): SurveyResponse[] {
  return surveyResponses;
}

export function addSurveyResponse(input: SurveyResponse["answers"]): SurveyResponse {
  const response: SurveyResponse = {
    id: `resp-${surveyResponses.length + 1}`,
    answers: input,
    analysis: null,
  };
  surveyResponses.push(response);
  return response;
}

export function setSurveyResponseAnalysis(id: string, analysis: SurveyAnalysis): SurveyResponse | undefined {
  const response = surveyResponses.find((r) => r.id === id);
  if (!response) return undefined;
  response.analysis = analysis;
  return response;
}
```

- [ ] **Step 4: Verify types**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/store
git commit -m "feat: add seeded in-memory stores for all three tools"
```

---

### Task 6: Workflow Drift Monitor

**Files:**
- Create: `app/api/drift-monitor/route.ts`
- Create: `app/drift-monitor/page.tsx`
- Create: `app/drift-monitor/DriftMonitorClient.tsx`

**Interfaces:**
- Consumes: `Card`, `RiskPill`, `PageShell` (Task 2); `callStructured`, `classifyError` (Task 3); `DriftAssessmentSchema` (Task 4); `Workflow`, `getWorkflows`, `getWorkflowById`, `updateWorkflowAssessment` (Task 5).
- Produces: `POST /api/drift-monitor` (body `{ workflowId: string }` → `{ workflow: Workflow }` or `{ error: { kind, message } }`, 502 on AI failure, 404 if not found); `/drift-monitor` page.

- [ ] **Step 1: Write `app/api/drift-monitor/route.ts`**

```ts
import { NextResponse } from "next/server";
import { callStructured, classifyError } from "@/lib/ai";
import { DriftAssessmentSchema } from "@/lib/schemas/drift-assessment";
import { getWorkflowById, updateWorkflowAssessment, type Workflow } from "@/lib/store/workflows";

function buildPrompt(workflow: Workflow) {
  return `You are assessing whether an internal AI-assisted workflow has drifted since it was approved.

Workflow name: ${workflow.name}
Owner: ${workflow.owner}
Description (including how it is currently described as being used): ${workflow.description}
Dependencies (tools/APIs/systems it relies on): ${workflow.dependencies.join("; ")}
Date approved: ${workflow.dateApproved}
Last verified: ${workflow.lastVerified}

Assess:
1. Whether anything in the dependency list has likely changed or become unreliable.
2. Whether the description is internally consistent with how the workflow is described as still being used today.
3. An overall risk level: "healthy" if nothing suggests a problem, "at_risk" if there are signs of possible drift, "broken" if a dependency is clearly no longer viable (e.g. explicitly deprecated or shut down).
4. A single, concrete next action someone should take.`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const workflowId = body.workflowId as string;
  const workflow = getWorkflowById(workflowId);

  if (!workflow) {
    return NextResponse.json({ error: { kind: "not_found", message: "Workflow not found." } }, { status: 404 });
  }

  try {
    const assessment = await callStructured(DriftAssessmentSchema, buildPrompt(workflow));
    const updated = updateWorkflowAssessment(workflow.id, assessment);
    return NextResponse.json({ workflow: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ error: { kind, message } }, { status: 502 });
  }
}
```

- [ ] **Step 2: Write `app/drift-monitor/page.tsx`**

```tsx
import { PageShell } from "@/lib/ui/PageShell";
import { getWorkflows } from "@/lib/store/workflows";
import { DriftMonitorClient } from "./DriftMonitorClient";

export default function DriftMonitorPage() {
  const workflows = getWorkflows();

  return (
    <PageShell
      title="Workflow Drift Monitor"
      description="Approved workflows don't stay healthy forever. Run a health check to see whether a workflow's dependencies or description show signs of drift."
    >
      <DriftMonitorClient initialWorkflows={workflows} />
    </PageShell>
  );
}
```

- [ ] **Step 3: Write `app/drift-monitor/DriftMonitorClient.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Card } from "@/lib/ui/Card";
import { RiskPill } from "@/lib/ui/RiskPill";
import type { Workflow } from "@/lib/store/workflows";

const COLUMNS: { key: "unchecked" | "healthy" | "at_risk" | "broken"; label: string }[] = [
  { key: "unchecked", label: "Not Yet Checked" },
  { key: "healthy", label: "Healthy" },
  { key: "at_risk", label: "At Risk" },
  { key: "broken", label: "Broken" },
];

function columnFor(workflow: Workflow) {
  return workflow.assessment?.riskLevel ?? "unchecked";
}

export function DriftMonitorClient({ initialWorkflows }: { initialWorkflows: Workflow[] }) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorByWorkflow, setErrorByWorkflow] = useState<Record<string, string>>({});

  const selected = workflows.find((w) => w.id === selectedId) ?? null;

  async function runHealthCheck(id: string) {
    setLoadingId(id);
    setErrorByWorkflow((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch("/api/drift-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorByWorkflow((prev) => ({ ...prev, [id]: data.error?.message ?? "Health check failed." }));
        return;
      }
      setWorkflows((prev) => prev.map((w) => (w.id === id ? data.workflow : w)));
      setSelectedId(id);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {COLUMNS.map((column) => (
          <div key={column.key}>
            <h2 className="font-mono text-xs uppercase tracking-wide text-text-muted">{column.label}</h2>
            <div className="mt-3 space-y-3">
              {workflows
                .filter((w) => columnFor(w) === column.key)
                .map((workflow) => (
                  <Card key={workflow.id} className={selectedId === workflow.id ? "border-amber" : ""}>
                    <button type="button" onClick={() => setSelectedId(workflow.id)} className="w-full text-left">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-sm font-semibold text-text">{workflow.name}</h3>
                        {workflow.assessment && <RiskPill level={workflow.assessment.riskLevel} />}
                      </div>
                      <p className="mt-1 text-xs text-text-muted">Owner: {workflow.owner}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => runHealthCheck(workflow.id)}
                      disabled={loadingId === workflow.id}
                      className="mt-3 rounded border border-amber px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft disabled:opacity-50"
                    >
                      {loadingId === workflow.id ? "Checking..." : "Run Health Check"}
                    </button>
                    {errorByWorkflow[workflow.id] && (
                      <p className="mt-2 text-xs text-broken">{errorByWorkflow[workflow.id]}</p>
                    )}
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Card>
        {!selected && <p className="text-sm text-text-muted">Select a workflow to see its detail.</p>}
        {selected && (
          <div>
            <h3 className="font-display text-base font-semibold text-text">{selected.name}</h3>
            <p className="mt-2 text-sm text-text-muted">{selected.description}</p>
            <p className="mt-3 font-mono text-xs uppercase tracking-wide text-text-muted">Dependencies</p>
            <ul className="mt-1 list-inside list-disc text-sm text-text-muted">
              {selected.dependencies.map((dependency) => (
                <li key={dependency}>{dependency}</li>
              ))}
            </ul>
            {selected.assessment && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <RiskPill level={selected.assessment.riskLevel} />
                <p className="text-sm text-text">
                  <span className="text-text-muted">Dependency change likelihood: </span>
                  {selected.assessment.dependencyChangeLikelihood}
                </p>
                <p className="text-sm text-text">
                  <span className="text-text-muted">Description consistency: </span>
                  {selected.assessment.descriptionConsistency}
                </p>
                <p className="text-sm text-text">
                  <span className="text-text-muted">Suggested next action: </span>
                  {selected.assessment.suggestedNextAction}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: build passes with no type errors.

- [ ] **Step 5: Manually verify with the dev server**

Run: `ANTHROPIC_API_KEY=<your key> npm run dev`, open `http://localhost:3000/drift-monitor`.
Expected: 3 seeded workflows render under "Not Yet Checked." Click "Run Health Check" on each. The healthy-seeded workflow should land in Healthy, the deprecated-API one should land in Broken, and the detail panel should show real model reasoning and a suggested next action for each.

Then stop the server, run `npm run dev` again without `ANTHROPIC_API_KEY` set, click "Run Health Check."
Expected: an inline error banner reading "AI service unavailable — ANTHROPIC_API_KEY is not set." appears on that workflow's card — no crash.

- [ ] **Step 6: Commit**

```bash
git add app/api/drift-monitor app/drift-monitor
git commit -m "feat: add Workflow Drift Monitor tool"
```

---

### Task 7: Manager Review Copilot

**Files:**
- Create: `app/api/review-copilot/route.ts`
- Create: `app/review-copilot/page.tsx`
- Create: `app/review-copilot/ReviewCopilotClient.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `PageShell` (Task 2); `callStructured`, `classifyError` (Task 3); `ReviewBriefSchema` (Task 4); `Submission`, `SubmissionStatus`, `getSubmissions`, `getSubmissionById`, `addSubmission`, `setSubmissionBrief`, `setSubmissionStatus` (Task 5).
- Produces: `POST /api/review-copilot` (body `{ employeeName, whatItDoes, toolOrPromptUsed, claimedTimeSavedPerWeek, dataTouched }` → `{ submission: Submission }` or `{ submission, error }` on 502); `PATCH /api/review-copilot` (body `{ id, status }` → `{ submission: Submission }`); `/review-copilot` page.

- [ ] **Step 1: Write `app/api/review-copilot/route.ts`**

```ts
import { NextResponse } from "next/server";
import { callStructured, classifyError } from "@/lib/ai";
import { ReviewBriefSchema } from "@/lib/schemas/review-brief";
import {
  addSubmission,
  getSubmissionById,
  setSubmissionBrief,
  setSubmissionStatus,
  type SubmissionStatus,
} from "@/lib/store/submissions";

function buildPrompt(input: {
  whatItDoes: string;
  toolOrPromptUsed: string;
  claimedTimeSavedPerWeek: string;
  dataTouched: string;
}) {
  return `An employee submitted the following AI-assisted workflow for manager approval. The manager may not be AI-literate — write for them.

What it does: ${input.whatItDoes}
Tool/prompt/process used: ${input.toolOrPromptUsed}
Claimed time saved per week: ${input.claimedTimeSavedPerWeek}
Data it touches: ${input.dataTouched}

Produce:
1. A plain-language explanation of what this workflow actually does, avoiding jargon.
2. Between 3 and 5 specific questions the manager should ask the employee before approving.
3. Any risk flags — sensitive data handling, over-claimed time savings, no fallback if the AI is wrong, or anything else concerning. Return an empty list if there are genuinely none.
4. A recommendation: "approve", "approve_with_changes", or "needs_discussion", with reasoning.`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { employeeName, whatItDoes, toolOrPromptUsed, claimedTimeSavedPerWeek, dataTouched } = body;

  const submission = addSubmission({ employeeName, whatItDoes, toolOrPromptUsed, claimedTimeSavedPerWeek, dataTouched });

  try {
    const brief = await callStructured(
      ReviewBriefSchema,
      buildPrompt({ whatItDoes, toolOrPromptUsed, claimedTimeSavedPerWeek, dataTouched })
    );
    const updated = setSubmissionBrief(submission.id, brief);
    return NextResponse.json({ submission: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ submission, error: { kind, message } }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status } = body as { id: string; status: SubmissionStatus };

  const existing = getSubmissionById(id);
  if (!existing) {
    return NextResponse.json({ error: { kind: "not_found", message: "Submission not found." } }, { status: 404 });
  }

  const updated = setSubmissionStatus(id, status);
  return NextResponse.json({ submission: updated });
}
```

- [ ] **Step 2: Write `app/review-copilot/page.tsx`**

```tsx
import { PageShell } from "@/lib/ui/PageShell";
import { getSubmissions } from "@/lib/store/submissions";
import { ReviewCopilotClient } from "./ReviewCopilotClient";

export default function ReviewCopilotPage() {
  const submissions = getSubmissions();

  return (
    <PageShell
      title="Manager Review Copilot"
      description="Employees submit a workflow. The system generates a structured review brief so a manager can actually judge it, not just rubber-stamp it."
    >
      <ReviewCopilotClient initialSubmissions={submissions} />
    </PageShell>
  );
}
```

- [ ] **Step 3: Write `app/review-copilot/ReviewCopilotClient.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Card } from "@/lib/ui/Card";
import { Badge } from "@/lib/ui/Badge";
import type { Submission, SubmissionStatus } from "@/lib/store/submissions";

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  approved_with_changes: "Approved with changes",
  rejected: "Rejected",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  approve: "Approve",
  approve_with_changes: "Approve with changes",
  needs_discussion: "Needs discussion",
};

const EMPTY_FORM = {
  employeeName: "",
  whatItDoes: "",
  toolOrPromptUsed: "",
  claimedTimeSavedPerWeek: "",
  dataTouched: "",
};

export function ReviewCopilotClient({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedId, setSelectedId] = useState<string | null>(initialSubmissions[0]?.id ?? null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/review-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message ?? "Failed to generate review brief.");
        if (data.submission) {
          setSubmissions((prev) => [...prev, data.submission]);
          setSelectedId(data.submission.id);
        }
        return;
      }
      setSubmissions((prev) => [...prev, data.submission]);
      setSelectedId(data.submission.id);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(status: SubmissionStatus) {
    if (!selected) return;
    const response = await fetch("/api/review-copilot", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status }),
    });
    const data = await response.json();
    if (response.ok) {
      setSubmissions((prev) => prev.map((s) => (s.id === selected.id ? data.submission : s)));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <h2 className="font-display text-base font-semibold text-text">Submit a workflow</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              required
              placeholder="Your name"
              value={form.employeeName}
              onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <textarea
              required
              placeholder="What does the workflow do?"
              value={form.whatItDoes}
              onChange={(e) => setForm({ ...form, whatItDoes: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
              rows={3}
            />
            <input
              required
              placeholder="What tool/prompt/process does it use?"
              value={form.toolOrPromptUsed}
              onChange={(e) => setForm({ ...form, toolOrPromptUsed: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <input
              required
              placeholder="Claimed time saved per week"
              value={form.claimedTimeSavedPerWeek}
              onChange={(e) => setForm({ ...form, claimedTimeSavedPerWeek: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <input
              required
              placeholder="What data does it touch?"
              value={form.dataTouched}
              onChange={(e) => setForm({ ...form, dataTouched: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded border border-amber px-4 py-2 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft disabled:opacity-50"
            >
              {submitting ? "Generating brief..." : "Submit for review"}
            </button>
            {error && <p className="text-xs text-broken">{error}</p>}
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-text">Submissions</h2>
          <div className="mt-3 space-y-2">
            {submissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => setSelectedId(submission.id)}
                className={`block w-full rounded border px-3 py-2 text-left text-sm ${
                  selectedId === submission.id ? "border-amber text-text" : "border-border text-text-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{submission.employeeName}</span>
                  <Badge>{STATUS_LABELS[submission.status]}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        {!selected && <p className="text-sm text-text-muted">Select a submission to see its review brief.</p>}
        {selected && !selected.brief && <p className="text-sm text-text-muted">Generating review brief...</p>}
        {selected?.brief && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-text">{selected.employeeName}&apos;s workflow</h3>
              <Badge>{RECOMMENDATION_LABELS[selected.brief.recommendation]}</Badge>
            </div>
            <p className="text-sm text-text">{selected.brief.plainLanguageExplanation}</p>

            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Questions to ask</p>
              <ul className="mt-1 list-inside list-disc text-sm text-text">
                {selected.brief.managerQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>

            {selected.brief.riskFlags.length > 0 && (
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-broken">Risk flags</p>
                <ul className="mt-1 list-inside list-disc text-sm text-broken">
                  {selected.brief.riskFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm text-text-muted">{selected.brief.recommendationReasoning}</p>

            <div className="flex gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => updateStatus("approved")}
                className="rounded border border-healthy px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-healthy hover:bg-healthy/15"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => updateStatus("approved_with_changes")}
                className="rounded border border-at-risk px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-at-risk hover:bg-at-risk/15"
              >
                Approve with changes
              </button>
              <button
                type="button"
                onClick={() => updateStatus("rejected")}
                className="rounded border border-broken px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-broken hover:bg-broken/15"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: build passes with no type errors.

- [ ] **Step 5: Manually verify with the dev server**

Run: `ANTHROPIC_API_KEY=<your key> npm run dev`, open `http://localhost:3000/review-copilot`.
Expected: 3 seeded submissions listed. Selecting `sub-2` (over-claimed time savings, no fallback) and `sub-3` (sensitive data via consumer tool) should show a "needs discussion" or risk-flagged brief; `sub-1` should lean "approve." Submit a new workflow via the form and confirm a brief generates and appears selected. Click Approve/Reject and confirm the badge updates.

- [ ] **Step 6: Commit**

```bash
git add app/api/review-copilot app/review-copilot
git commit -m "feat: add Manager Review Copilot tool"
```

---

### Task 8: Shadow AI Discovery Scanner

**Files:**
- Create: `app/api/shadow-scanner/route.ts`
- Create: `app/shadow-scanner/page.tsx`
- Create: `app/shadow-scanner/SurveyForm.tsx`
- Create: `app/shadow-scanner/aggregate/page.tsx`

**Interfaces:**
- Consumes: `Card`, `PageShell` (Task 2); `callStructured`, `classifyError` (Task 3); `SurveyAnalysisSchema` (Task 4); `SurveyResponse`, `getSurveyResponses`, `addSurveyResponse`, `setSurveyResponseAnalysis` (Task 5).
- Produces: `POST /api/shadow-scanner` (body `{ toolsUsed, whatFor, howOften }` → `{ response: SurveyResponse }` or `{ response, error }` on 502); `/shadow-scanner` survey page; `/shadow-scanner/aggregate` aggregate view.

- [ ] **Step 1: Write `app/api/shadow-scanner/route.ts`**

```ts
import { NextResponse } from "next/server";
import { callStructured, classifyError } from "@/lib/ai";
import { SurveyAnalysisSchema } from "@/lib/schemas/survey-analysis";
import { addSurveyResponse, setSurveyResponseAnalysis } from "@/lib/store/survey-responses";

function buildPrompt(answers: { toolsUsed: string; whatFor: string; howOften: string }) {
  return `An employee answered a short survey about informal AI tool usage at work.

What AI tools have you used at work in the last month? ${answers.toolsUsed}
What did you use them for? ${answers.whatFor}
How often? ${answers.howOften}

Extract:
1. The specific AI tools mentioned, as a list.
2. A short use-case category (e.g. "Internal communications", "Software development", "Client document review").
3. An informal-usage risk flag if the response suggests sensitive data handling, no oversight, or use of an unvetted personal/consumer tool for work data — otherwise null.
4. A one-line summary of the response.`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const answers = {
    toolsUsed: body.toolsUsed as string,
    whatFor: body.whatFor as string,
    howOften: body.howOften as string,
  };

  const surveyResponse = addSurveyResponse(answers);

  try {
    const analysis = await callStructured(SurveyAnalysisSchema, buildPrompt(answers));
    const updated = setSurveyResponseAnalysis(surveyResponse.id, analysis);
    return NextResponse.json({ response: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ response: surveyResponse, error: { kind, message } }, { status: 502 });
  }
}
```

- [ ] **Step 2: Write `app/shadow-scanner/page.tsx`**

```tsx
import { PageShell } from "@/lib/ui/PageShell";
import { SurveyForm } from "./SurveyForm";

export default function ShadowScannerPage() {
  return (
    <PageShell
      title="Shadow AI Discovery Scanner"
      description="A short survey about AI tools employees are already using informally, before any training program starts."
    >
      <SurveyForm />
    </PageShell>
  );
}
```

- [ ] **Step 3: Write `app/shadow-scanner/SurveyForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/lib/ui/Card";

const EMPTY_FORM = { toolsUsed: "", whatFor: "", howOften: "" };

export function SurveyForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/shadow-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message ?? "Failed to submit response.");
        return;
      }
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <p className="text-sm text-text">Thanks — your response has been recorded.</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="rounded border border-amber px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft"
          >
            Submit another response
          </button>
          <Link
            href="/shadow-scanner/aggregate"
            className="rounded border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-text-muted hover:text-text"
          >
            View aggregate results
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm text-text-muted">
          What AI tools have you used at work in the last month?
          <textarea
            required
            value={form.toolsUsed}
            onChange={(e) => setForm({ ...form, toolsUsed: e.target.value })}
            className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            rows={2}
          />
        </label>
        <label className="block text-sm text-text-muted">
          What did you use them for, and how?
          <textarea
            required
            value={form.whatFor}
            onChange={(e) => setForm({ ...form, whatFor: e.target.value })}
            className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            rows={3}
          />
        </label>
        <label className="block text-sm text-text-muted">
          How often?
          <input
            required
            value={form.howOften}
            onChange={(e) => setForm({ ...form, howOften: e.target.value })}
            className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded border border-amber px-4 py-2 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit response"}
        </button>
        {error && <p className="text-xs text-broken">{error}</p>}
      </form>
    </Card>
  );
}
```

- [ ] **Step 4: Write `app/shadow-scanner/aggregate/page.tsx`**

```tsx
import { PageShell } from "@/lib/ui/PageShell";
import { Card } from "@/lib/ui/Card";
import { getSurveyResponses } from "@/lib/store/survey-responses";

function countBy(values: string[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export default function AggregatePage() {
  const responses = getSurveyResponses().filter((r) => r.analysis !== null);

  const tools = countBy(responses.flatMap((r) => r.analysis!.toolsMentioned));
  const useCases = countBy(responses.map((r) => r.analysis!.useCaseCategory));
  const riskFlags = countBy(
    responses.map((r) => r.analysis!.riskFlag).filter((flag): flag is string => flag !== null)
  );

  return (
    <PageShell
      title="Shadow AI Discovery — Aggregate Results"
      description={`Based on ${responses.length} analyzed survey responses.`}
    >
      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <h2 className="font-display text-sm font-semibold text-text">Most common tools</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            {tools.map((tool) => (
              <li key={tool.label} className="flex justify-between">
                <span>{tool.label}</span>
                <span className="font-mono text-text">{tool.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-sm font-semibold text-text">Most common use cases</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            {useCases.map((useCase) => (
              <li key={useCase.label} className="flex justify-between">
                <span>{useCase.label}</span>
                <span className="font-mono text-text">{useCase.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-sm font-semibold text-broken">Risk flags (ranked)</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            {riskFlags.length === 0 && <li>None reported.</li>}
            {riskFlags.map((flag) => (
              <li key={flag.label} className="flex justify-between gap-3">
                <span>{flag.label}</span>
                <span className="font-mono text-text">{flag.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: build passes with no type errors.

- [ ] **Step 6: Manually verify with the dev server**

Run: `npm run dev`, open `http://localhost:3000/shadow-scanner/aggregate`.
Expected: 8 seeded responses aggregated — ChatGPT should be the most common tool, and both seeded risk flags (personal-account contract data, unvetted budgeting tool) should appear in the ranked list.

Then open `http://localhost:3000/shadow-scanner` with `ANTHROPIC_API_KEY` set, submit a new response, and confirm the confirmation screen appears and the aggregate view (reloaded) now reflects 9 responses.

- [ ] **Step 7: Commit**

```bash
git add app/api/shadow-scanner app/shadow-scanner
git commit -m "feat: add Shadow AI Discovery Scanner tool"
```

---

### Task 9: README and final verification pass

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: final deliverable satisfying the spec's deliverables checklist.

- [ ] **Step 1: Write `README.md`**

```markdown
# TAI Labs Prototype Suite

Three AI-backed prototype tools built for a TAI Labs Product/GTM Engineer Intern take-home assessment. See `prompt.md` for the original brief and `docs/superpowers/specs/2026-08-17-tai-tools-design.md` for the full design.

## Setup

\`\`\`bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npm run dev
\`\`\`

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
```

- [ ] **Step 2: Final full verification pass**

Run: `npm run build`
Expected: build passes cleanly.

Run: `ANTHROPIC_API_KEY=<your key> npm run dev` and manually re-walk all three tools' seed-data paths (health-check all 3 workflows, view all 3 review briefs, load the Shadow Scanner aggregate view) to confirm nothing regressed across tasks.

Run: `npm run dev` with `ANTHROPIC_API_KEY` unset and confirm all three tools show their inline error banner instead of crashing.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add per-tool README sections and verification notes"
```
