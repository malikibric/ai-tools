import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, notFound, readJsonBody } from "@/lib/http";
import {
  deleteSubmission,
  setSubmissionStatus,
  updateSubmission,
  type SubmissionInput,
  type SubmissionStatus,
} from "@/lib/tools/review-copilot/store";

const UpdateSchema = z.object({
  employeeName: z.string().min(1).optional(),
  whatItDoes: z.string().min(1).optional(),
  toolOrPromptUsed: z.string().min(1).optional(),
  claimedTimeSavedPerWeek: z.string().min(1).optional(),
  dataTouched: z.string().min(1).optional(),
});

const StatusSchema = z.object({
  status: z.enum(["pending", "approved", "approved_with_changes", "rejected"]),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJsonBody(request, UpdateSchema);
  if (!body) return badRequest("No valid fields provided.");
  const submission = await updateSubmission(id, body as Partial<SubmissionInput>);
  if (!submission) return notFound("Submission not found.");
  return NextResponse.json({ submission });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJsonBody(request, StatusSchema);
  if (!body) return badRequest("A valid status is required.");
  const submission = await setSubmissionStatus(id, body.status as SubmissionStatus);
  if (!submission) return notFound("Submission not found.");
  return NextResponse.json({ submission });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteSubmission(id);
  return NextResponse.json({ ok: true });
}
