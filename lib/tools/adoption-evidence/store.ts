import type { AdoptionAssessment } from "./schema";

export type AdoptionWorkflow = {
  id: string;
  name: string;
  owner: string;
  description: string;
  claimedRunsPerWeek: number;
  claimedMinutesPerRun: number;
  weeklyRuns: number[];
  lastRunAt: string | null;
  instrumentedAt: string;
  assessment: AdoptionAssessment | null;
};

export type AdoptionLevel = "strong" | "slipping" | "at_risk" | "stalled";

export type AdoptionMetrics = {
  score: number;
  level: AdoptionLevel;
  recentAvgRuns: number;
  olderAvgRuns: number;
  adherencePoints: number;
  trendPoints: number;
  recencyPoints: number;
};

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Behavior-change score (0-100) computed deterministically from telemetry, so it is
 * reproducible and auditable by an executive. The AI never sets the score — it explains it.
 *
 * - Adherence (0-50): recent 4-week avg runs vs the run frequency claimed at approval.
 * - Trend (0-30): recent 4-week avg vs the previous 4-week avg.
 * - Recency (0-20): how long since the workflow last phoned home.
 */
export function computeAdoptionMetrics(workflow: AdoptionWorkflow): AdoptionMetrics {
  const weeks = workflow.weeklyRuns;
  if (weeks.length === 0) {
    return {
      score: 0,
      level: "stalled",
      recentAvgRuns: 0,
      olderAvgRuns: 0,
      adherencePoints: 0,
      trendPoints: 0,
      recencyPoints: 0,
    };
  }
  const recent = weeks.slice(-4);
  const older = weeks.slice(0, Math.max(weeks.length - 4, 0));
  const recentTotal = recent.reduce((a, b) => a + b, 0);
  const olderTotal = older.reduce((a, b) => a + b, 0);
  const recentAvg = recentTotal / recent.length;
  const olderAvg = older.length > 0 ? olderTotal / older.length : recentAvg;

  const adherencePoints = Math.min(recentAvg / workflow.claimedRunsPerWeek, 1) * 50;

  let trendPoints: number;
  if (older.length === 0) {
    trendPoints = 20;
  } else if (recentAvg >= olderAvg * 1.1) {
    trendPoints = 30;
  } else if (recentAvg >= olderAvg) {
    trendPoints = 20;
  } else if (recentAvg >= olderAvg * 0.6) {
    trendPoints = 10;
  } else {
    trendPoints = 0;
  }

  const lastRunAt = workflow.lastRunAt ? Date.parse(workflow.lastRunAt) : null;
  const daysSince = lastRunAt ? (Date.now() - lastRunAt) / 86_400_000 : Infinity;
  const recencyPoints = daysSince <= 7 ? 20 : daysSince <= 14 ? 10 : 0;

  const score = Math.round(adherencePoints + trendPoints + recencyPoints);

  let level: AdoptionLevel;
  if (recentTotal === 0) {
    level = "stalled";
  } else if (score >= 70) {
    level = "strong";
  } else if (score >= 40) {
    level = "slipping";
  } else {
    level = "at_risk";
  }

  return {
    score,
    level,
    recentAvgRuns: round1(recentAvg),
    olderAvgRuns: round1(olderAvg),
    adherencePoints: round1(adherencePoints),
    trendPoints,
    recencyPoints,
  };
}

export type AdoptionSummary = {
  workflowCount: number;
  strongCount: number;
  stalledCount: number;
  avgScore: number;
  claimedMinutesPerWeek: number;
  measuredMinutesPerWeek: number;
};

export function summarizeAdoption(workflows: AdoptionWorkflow[]): AdoptionSummary {
  let strongCount = 0;
  let stalledCount = 0;
  let scoreSum = 0;
  let claimedMinutesPerWeek = 0;
  let measuredMinutesPerWeek = 0;

  for (const workflow of workflows) {
    const metrics = computeAdoptionMetrics(workflow);
    scoreSum += metrics.score;
    if (metrics.level === "strong") strongCount += 1;
    if (metrics.level === "stalled") stalledCount += 1;
    claimedMinutesPerWeek += workflow.claimedRunsPerWeek * workflow.claimedMinutesPerRun;
    measuredMinutesPerWeek += metrics.recentAvgRuns * workflow.claimedMinutesPerRun;
  }

  return {
    workflowCount: workflows.length,
    strongCount,
    stalledCount,
    avgScore: workflows.length > 0 ? Math.round(scoreSum / workflows.length) : 0,
    claimedMinutesPerWeek: Math.round(claimedMinutesPerWeek),
    measuredMinutesPerWeek: Math.round(measuredMinutesPerWeek),
  };
}

let adoptionWorkflows: AdoptionWorkflow[] = [
  {
    id: "ad-1",
    name: "Weekly Support Ticket Triage",
    owner: "Priya Nandakumar",
    description:
      "Pulls the previous week's support tickets, classifies each by urgency and topic, and posts a summary to #support-ops. The team references the summary every Monday stand-up — usage has grown steadily since launch.",
    claimedRunsPerWeek: 3,
    claimedMinutesPerRun: 12,
    weeklyRuns: [2, 2, 3, 3, 3, 3, 4, 4],
    lastRunAt: daysAgo(1),
    instrumentedAt: daysAgo(140),
    assessment: null,
  },
  {
    id: "ad-2",
    name: "Competitor Pricing Digest",
    owner: "Marcus Webb",
    description:
      "Scrapes three competitor pricing pages and drafts a comparison doc. The team mentioned recently that the digest 'looks a little empty lately' — run frequency has been quietly sliding for a month.",
    claimedRunsPerWeek: 2,
    claimedMinutesPerRun: 25,
    weeklyRuns: [2, 2, 2, 2, 2, 1, 1, 1],
    lastRunAt: daysAgo(3),
    instrumentedAt: daysAgo(120),
    assessment: null,
  },
  {
    id: "ad-3",
    name: "Onboarding Brief Generator",
    owner: "Tomas Lindqvist",
    description:
      "Generates a personalized onboarding brief for each new hire. Used steadily during the first month after training, then dropped to zero — the team went back to the old manual template.",
    claimedRunsPerWeek: 2,
    claimedMinutesPerRun: 20,
    weeklyRuns: [3, 2, 2, 1, 0, 0, 0, 0],
    lastRunAt: daysAgo(35),
    instrumentedAt: daysAgo(180),
    assessment: null,
  },
  {
    id: "ad-4",
    name: "Legacy Invoice Summarizer",
    owner: "Dana Ruiz",
    description:
      "Summarizes incoming vendor invoices via the AcmeInvoice API and emails the summary to accounts payable. AcmeInvoice v1 was deprecated and shut off — usage collapsed as failures mounted.",
    claimedRunsPerWeek: 2,
    claimedMinutesPerRun: 15,
    weeklyRuns: [4, 4, 4, 4, 2, 1, 1, 0],
    lastRunAt: daysAgo(14),
    instrumentedAt: daysAgo(200),
    assessment: null,
  },
];

export function getAdoptionWorkflows(): AdoptionWorkflow[] {
  return adoptionWorkflows;
}

export function getAdoptionWorkflowById(id: string): AdoptionWorkflow | undefined {
  return adoptionWorkflows.find((w) => w.id === id);
}

export function setAdoptionAssessment(
  id: string,
  assessment: AdoptionAssessment
): AdoptionWorkflow | undefined {
  const workflow = getAdoptionWorkflowById(id);
  if (!workflow) return undefined;
  workflow.assessment = assessment;
  return workflow;
}

/**
 * Simulates the workflow itself phoning home with a heartbeat (the same call a real
 * instrumented workflow would make after each run). Increments the current week's run
 * count and stamps the last-run time.
 */
export function recordHeartbeat(id: string): AdoptionWorkflow | undefined {
  const workflow = getAdoptionWorkflowById(id);
  if (!workflow) return undefined;
  workflow.weeklyRuns[workflow.weeklyRuns.length - 1] += 1;
  if (workflow.weeklyRuns.length > 12) {
    workflow.weeklyRuns.shift();
  }
  workflow.lastRunAt = new Date().toISOString();
  return workflow;
}
