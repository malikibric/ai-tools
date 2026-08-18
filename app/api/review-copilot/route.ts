import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, readJsonBody } from "@/lib/http";
import { createSubmission, getSubmissions, type SubmissionInput } from "@/lib/tools/review-copilot/store";

const CreateSchema = z.object({
  id: z.string().optional(),
  employeeName: z.string().min(1),
  whatItDoes: z.string().min(1),
  toolOrPromptUsed: z.string().min(1),
  claimedTimeSavedPerWeek: z.string().min(1),
  dataTouched: z.string().min(1),
});

export async function GET() {
  return NextResponse.json({ submissions: await getSubmissions() });
}

export async function POST(request: Request) {
  const body = await readJsonBody(request, CreateSchema);
  if (!body) return badRequest("All submission fields are required.");
  const submission = await createSubmission(body as SubmissionInput);
  return NextResponse.json({ submission });
}
