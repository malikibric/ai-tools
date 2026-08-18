import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { ReviewBrief } from "./schema";

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

function fromRow(r: {
  id: string;
  employeeName: string;
  whatItDoes: string;
  toolOrPromptUsed: string;
  claimedTimeSavedPerWeek: string;
  dataTouched: string;
  status: string;
  brief: unknown;
}): Submission {
  return {
    id: r.id,
    employeeName: r.employeeName,
    whatItDoes: r.whatItDoes,
    toolOrPromptUsed: r.toolOrPromptUsed,
    claimedTimeSavedPerWeek: r.claimedTimeSavedPerWeek,
    dataTouched: r.dataTouched,
    status: r.status as SubmissionStatus,
    brief: (r.brief as ReviewBrief) ?? null,
  };
}

export async function getSubmissions(): Promise<Submission[]> {
  return (await prisma.submission.findMany({ orderBy: { id: "asc" } })).map(fromRow);
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  const r = await prisma.submission.findUnique({ where: { id } });
  return r ? fromRow(r) : null;
}

export type SubmissionInput = {
  id?: string;
  employeeName: string;
  whatItDoes: string;
  toolOrPromptUsed: string;
  claimedTimeSavedPerWeek: string;
  dataTouched: string;
};

export async function createSubmission(input: SubmissionInput): Promise<Submission> {
  const r = await prisma.submission.create({
    data: {
      id: input.id ?? `sub-${randomUUID().slice(0, 8)}`,
      employeeName: input.employeeName,
      whatItDoes: input.whatItDoes,
      toolOrPromptUsed: input.toolOrPromptUsed,
      claimedTimeSavedPerWeek: input.claimedTimeSavedPerWeek,
      dataTouched: input.dataTouched,
      status: "pending",
    },
  });
  return fromRow(r);
}

export async function updateSubmission(id: string, input: Partial<SubmissionInput>): Promise<Submission | null> {
  const data: Record<string, unknown> = {};
  if (input.employeeName !== undefined) data.employeeName = input.employeeName;
  if (input.whatItDoes !== undefined) data.whatItDoes = input.whatItDoes;
  if (input.toolOrPromptUsed !== undefined) data.toolOrPromptUsed = input.toolOrPromptUsed;
  if (input.claimedTimeSavedPerWeek !== undefined) data.claimedTimeSavedPerWeek = input.claimedTimeSavedPerWeek;
  if (input.dataTouched !== undefined) data.dataTouched = input.dataTouched;
  const r = await prisma.submission.update({ where: { id }, data });
  return fromRow(r);
}

export async function setSubmissionBrief(id: string, brief: ReviewBrief): Promise<Submission | null> {
  const r = await prisma.submission.update({ where: { id }, data: { brief } });
  return fromRow(r);
}

export async function setSubmissionStatus(id: string, status: SubmissionStatus): Promise<Submission | null> {
  const r = await prisma.submission.update({ where: { id }, data: { status } });
  return fromRow(r);
}

export async function deleteSubmission(id: string): Promise<void> {
  await prisma.submission.delete({ where: { id } });
}
