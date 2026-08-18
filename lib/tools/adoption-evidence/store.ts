import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
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

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeAdoptionMetrics(workflow: AdoptionWorkflow): AdoptionMetrics {
  const weeks = workflow.weeklyRuns;
  if (weeks.length === 0) {
    return { score: 0, level: "stalled", recentAvgRuns: 0, olderAvgRuns: 0, adherencePoints: 0, trendPoints: 0, recencyPoints: 0 };
  }
  const recent = weeks.slice(-4);
  const older = weeks.slice(0, Math.max(weeks.length - 4, 0));
  const recentTotal = recent.reduce((a, b) => a + b, 0);
  const olderTotal = older.reduce((a, b) => a + b, 0);
  const recentAvg = recentTotal / recent.length;
  const olderAvg = older.length > 0 ? olderTotal / older.length : recentAvg;

  const adherencePoints = Math.min(recentAvg / workflow.claimedRunsPerWeek, 1) * 50;

  let trendPoints: number;
  if (older.length === 0) trendPoints = 20;
  else if (recentAvg >= olderAvg * 1.1) trendPoints = 30;
  else if (recentAvg >= olderAvg) trendPoints = 20;
  else if (recentAvg >= olderAvg * 0.6) trendPoints = 10;
  else trendPoints = 0;

  const lastRunAt = workflow.lastRunAt ? Date.parse(workflow.lastRunAt) : null;
  const daysSince = lastRunAt ? (Date.now() - lastRunAt) / 86_400_000 : Infinity;
  const recencyPoints = daysSince <= 7 ? 20 : daysSince <= 14 ? 10 : 0;

  const score = Math.round(adherencePoints + trendPoints + recencyPoints);

  let level: AdoptionLevel;
  if (recentTotal === 0) level = "stalled";
  else if (score >= 70) level = "strong";
  else if (score >= 40) level = "slipping";
  else level = "at_risk";

  return { score, level, recentAvgRuns: round1(recentAvg), olderAvgRuns: round1(olderAvg), adherencePoints: round1(adherencePoints), trendPoints, recencyPoints };
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

function fromRow(r: {
  id: string;
  name: string;
  owner: string;
  description: string;
  claimedRunsPerWeek: number;
  claimedMinutesPerRun: number;
  weeklyRuns: number[];
  lastRunAt: Date | null;
  instrumentedAt: Date;
  assessment: unknown;
}): AdoptionWorkflow {
  return {
    id: r.id,
    name: r.name,
    owner: r.owner,
    description: r.description,
    claimedRunsPerWeek: r.claimedRunsPerWeek,
    claimedMinutesPerRun: r.claimedMinutesPerRun,
    weeklyRuns: r.weeklyRuns,
    lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
    instrumentedAt: r.instrumentedAt.toISOString(),
    assessment: (r.assessment as AdoptionAssessment) ?? null,
  };
}

export async function getAdoptionWorkflows(): Promise<AdoptionWorkflow[]> {
  return (await prisma.adoptionWorkflow.findMany({ orderBy: { id: "asc" } })).map(fromRow);
}

export async function getAdoptionWorkflowById(id: string): Promise<AdoptionWorkflow | null> {
  const r = await prisma.adoptionWorkflow.findUnique({ where: { id } });
  return r ? fromRow(r) : null;
}

export type AdoptionWorkflowInput = {
  id?: string;
  name: string;
  owner: string;
  description: string;
  claimedRunsPerWeek: number;
  claimedMinutesPerRun: number;
  weeklyRuns?: number[];
  lastRunAt?: string | null;
};

export async function createAdoptionWorkflow(input: AdoptionWorkflowInput): Promise<AdoptionWorkflow> {
  const r = await prisma.adoptionWorkflow.create({
    data: {
      id: input.id ?? `ad-${randomUUID().slice(0, 8)}`,
      name: input.name,
      owner: input.owner,
      description: input.description,
      claimedRunsPerWeek: input.claimedRunsPerWeek,
      claimedMinutesPerRun: input.claimedMinutesPerRun,
      weeklyRuns: input.weeklyRuns ?? Array(8).fill(0),
      lastRunAt: input.lastRunAt ? new Date(input.lastRunAt) : null,
    },
  });
  return fromRow(r);
}

export async function updateAdoptionWorkflow(
  id: string,
  input: Partial<AdoptionWorkflowInput>
): Promise<AdoptionWorkflow | null> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.owner !== undefined) data.owner = input.owner;
  if (input.description !== undefined) data.description = input.description;
  if (input.claimedRunsPerWeek !== undefined) data.claimedRunsPerWeek = input.claimedRunsPerWeek;
  if (input.claimedMinutesPerRun !== undefined) data.claimedMinutesPerRun = input.claimedMinutesPerRun;
  if (input.weeklyRuns !== undefined) data.weeklyRuns = input.weeklyRuns;
  if (input.lastRunAt !== undefined) data.lastRunAt = input.lastRunAt ? new Date(input.lastRunAt) : null;
  const r = await prisma.adoptionWorkflow.update({ where: { id }, data });
  return fromRow(r);
}

export async function deleteAdoptionWorkflow(id: string): Promise<void> {
  await prisma.adoptionWorkflow.delete({ where: { id } });
}

export async function setAdoptionAssessment(id: string, assessment: AdoptionAssessment): Promise<AdoptionWorkflow | null> {
  const r = await prisma.adoptionWorkflow.update({ where: { id }, data: { assessment } });
  return fromRow(r);
}

export async function recordHeartbeat(id: string): Promise<AdoptionWorkflow | null> {
  const r = await prisma.adoptionWorkflow.findUnique({ where: { id } });
  if (!r) return null;
  const weekly = [...r.weeklyRuns];
  weekly[weekly.length - 1] = (weekly[weekly.length - 1] ?? 0) + 1;
  if (weekly.length > 12) weekly.shift();
  const updated = await prisma.adoptionWorkflow.update({
    where: { id },
    data: { weeklyRuns: weekly, lastRunAt: new Date() },
  });
  return fromRow(updated);
}
