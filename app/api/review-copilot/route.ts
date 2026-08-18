import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, readJsonBody, withDbErrors } from "@/lib/http";
import { createSubmission, getSubmissions, type SubmissionInput } from "@/lib/tools/review-copilot/store";

const CreateSchema = z.object({
  id: z.string().max(100).optional(),
  employeeName: z.string().min(1).max(200),
  whatItDoes: z.string().min(1).max(5000),
  toolOrPromptUsed: z.string().min(1).max(2000),
  claimedTimeSavedPerWeek: z.string().min(1).max(200),
  dataTouched: z.string().min(1).max(2000),
});

export const GET = withDbErrors(async () => {
  return NextResponse.json({ submissions: await getSubmissions() });
});

export const POST = withDbErrors(async (request: Request) => {
  const body = await readJsonBody(request, CreateSchema);
  if (!body) return badRequest("All submission fields are required.");
  const submission = await createSubmission(body as SubmissionInput);
  return NextResponse.json({ submission });
});
