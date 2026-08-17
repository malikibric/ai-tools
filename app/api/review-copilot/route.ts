import { NextResponse } from "next/server";
import { z } from "zod";
import { callStructured, classifyError } from "@/lib/ai";
import { badRequest, notFound, readJsonBody } from "@/lib/http";
import { ReviewBriefSchema } from "@/lib/tools/review-copilot/schema";
import {
  addSubmission,
  getSubmissionById,
  setSubmissionBrief,
  setSubmissionStatus,
  type SubmissionStatus,
} from "@/lib/tools/review-copilot/store";

const ExistingSchema = z.object({ id: z.string().min(1) });

const CreateSchema = z.object({
  employeeName: z.string().min(1),
  whatItDoes: z.string().min(1),
  toolOrPromptUsed: z.string().min(1),
  claimedTimeSavedPerWeek: z.string().min(1),
  dataTouched: z.string().min(1),
});

const StatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "approved", "approved_with_changes", "rejected"]),
});

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
  const body = await readJsonBody(request, z.union([ExistingSchema, CreateSchema]));
  if (!body) return badRequest("Provide a submission id, or the full submission details.");

  let submission;
  if ("id" in body) {
    // Generate a brief for an existing submission (e.g. a seeded one).
    const existing = getSubmissionById(body.id);
    if (!existing) return notFound("Submission not found.");
    submission = existing;
  } else {
    // Create a new submission, then generate its brief.
    submission = addSubmission(body);
  }

  try {
    const brief = await callStructured(
      ReviewBriefSchema,
      buildPrompt({
        whatItDoes: submission.whatItDoes,
        toolOrPromptUsed: submission.toolOrPromptUsed,
        claimedTimeSavedPerWeek: submission.claimedTimeSavedPerWeek,
        dataTouched: submission.dataTouched,
      })
    );
    const updated = setSubmissionBrief(submission.id, brief);
    return NextResponse.json({ submission: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ submission, error: { kind, message } }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const body = await readJsonBody(request, StatusSchema);
  if (!body) return badRequest("id and a valid status are required.");

  const existing = getSubmissionById(body.id);
  if (!existing) return notFound("Submission not found.");

  const updated = setSubmissionStatus(body.id, body.status as SubmissionStatus);
  return NextResponse.json({ submission: updated });
}
