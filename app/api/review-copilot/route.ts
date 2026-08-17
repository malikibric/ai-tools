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
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { kind: "invalid_body", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  let submission;

  if (body?.id) {
    // Generate a brief for an existing submission (e.g. a seeded one).
    const existing = getSubmissionById(body.id as string);
    if (!existing) {
      return NextResponse.json({ error: { kind: "not_found", message: "Submission not found." } }, { status: 404 });
    }
    submission = existing;
  } else {
    // Create a new submission, then generate its brief.
    const { employeeName, whatItDoes, toolOrPromptUsed, claimedTimeSavedPerWeek, dataTouched } = body;
    submission = addSubmission({
      employeeName,
      whatItDoes,
      toolOrPromptUsed,
      claimedTimeSavedPerWeek,
      dataTouched,
    });
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
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { kind: "invalid_body", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }
  const { id, status } = body as { id: string; status: SubmissionStatus };

  const existing = getSubmissionById(id);
  if (!existing) {
    return NextResponse.json({ error: { kind: "not_found", message: "Submission not found." } }, { status: 404 });
  }

  const updated = setSubmissionStatus(id, status);
  return NextResponse.json({ submission: updated });
}
