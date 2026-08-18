import { NextResponse } from "next/server";
import { z } from "zod";
import { callStructured, classifyError } from "@/lib/ai";
import { badRequest, notFound, readJsonBody } from "@/lib/http";
import { ReviewBriefSchema } from "@/lib/tools/review-copilot/schema";
import { getSubmissionById, setSubmissionBrief } from "@/lib/tools/review-copilot/store";

const RequestSchema = z.object({ id: z.string().min(1) });

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
  const body = await readJsonBody(request, RequestSchema);
  if (!body) return badRequest("A submission id is required.");

  const submission = await getSubmissionById(body.id);
  if (!submission) return notFound("Submission not found.");

  try {
    const brief = await callStructured(ReviewBriefSchema, buildPrompt(submission));
    const updated = await setSubmissionBrief(submission.id, brief);
    return NextResponse.json({ submission: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ submission, error: { kind, message } }, { status: 502 });
  }
}
