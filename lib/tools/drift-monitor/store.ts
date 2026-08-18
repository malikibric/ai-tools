import { randomUUID } from "crypto";
import { isNotFoundError, prisma } from "@/lib/db";
import type { DriftAssessment } from "./schema";

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

function fromRow(r: {
  id: string;
  name: string;
  owner: string;
  description: string;
  dependencies: string[];
  dateApproved: string;
  lastVerified: string;
  assessment: unknown;
}): Workflow {
  return {
    id: r.id,
    name: r.name,
    owner: r.owner,
    description: r.description,
    dependencies: r.dependencies,
    dateApproved: r.dateApproved,
    lastVerified: r.lastVerified,
    assessment: (r.assessment as DriftAssessment) ?? null,
  };
}

export async function getWorkflows(): Promise<Workflow[]> {
  return (await prisma.driftWorkflow.findMany({ orderBy: { id: "asc" } })).map(fromRow);
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const r = await prisma.driftWorkflow.findUnique({ where: { id } });
  return r ? fromRow(r) : null;
}

export type DriftWorkflowInput = {
  id?: string;
  name: string;
  owner: string;
  description: string;
  dependencies?: string[];
  dateApproved: string;
  lastVerified: string;
};

export async function createWorkflow(input: DriftWorkflowInput): Promise<Workflow> {
  const r = await prisma.driftWorkflow.create({
    data: {
      id: input.id ?? `wf-${randomUUID().slice(0, 8)}`,
      name: input.name,
      owner: input.owner,
      description: input.description,
      dependencies: input.dependencies ?? [],
      dateApproved: input.dateApproved,
      lastVerified: input.lastVerified,
    },
  });
  return fromRow(r);
}

export async function updateWorkflow(id: string, input: Partial<DriftWorkflowInput>): Promise<Workflow | null> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.owner !== undefined) data.owner = input.owner;
  if (input.description !== undefined) data.description = input.description;
  if (input.dependencies !== undefined) data.dependencies = input.dependencies;
  if (input.dateApproved !== undefined) data.dateApproved = input.dateApproved;
  if (input.lastVerified !== undefined) data.lastVerified = input.lastVerified;
  try {
    const r = await prisma.driftWorkflow.update({ where: { id }, data });
    return fromRow(r);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function deleteWorkflow(id: string): Promise<void> {
  try {
    await prisma.driftWorkflow.delete({ where: { id } });
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }
}

export async function updateWorkflowAssessment(id: string, assessment: DriftAssessment): Promise<Workflow | null> {
  try {
    const r = await prisma.driftWorkflow.update({ where: { id }, data: { assessment } });
    return fromRow(r);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}
