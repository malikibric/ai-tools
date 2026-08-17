import { NextResponse } from "next/server";
import { callStructured, classifyError } from "@/lib/ai";
import { AdoptionAssessmentSchema } from "@/lib/schemas/adoption-assessment";
import {
  computeAdoptionMetrics,
  getAdoptionWorkflowById,
  setAdoptionAssessment,
  type AdoptionWorkflow,
} from "@/lib/store/adoption-workflows";

function buildPrompt(workflow: AdoptionWorkflow) {
  const metrics = computeAdoptionMetrics(workflow);
  const lastRun = workflow.lastRunAt
    ? `${Math.max(1, Math.round((Date.now() - Date.parse(workflow.lastRunAt)) / 86_400_000))} day(s) ago`
    : "never";

  return `You are analyzing why an employee-built AI workflow's real usage — measured from telemetry heartbeats the workflow itself sends after every run — is at its current level.

The adoption score and level are computed deterministically from the telemetry. Your job is the judgment: explain why, and what to do about it. Do not question or override the score.

Workflow name: ${workflow.name}
Owner: ${workflow.owner}
Description (including how it is described as being used today): ${workflow.description}
Runs per week claimed at approval: ${workflow.claimedRunsPerWeek}
Measured weekly runs (oldest to most recent): ${workflow.weeklyRuns.join(", ")}
Last run: ${lastRun}
Adoption score (0-100, computed): ${metrics.score}
Adoption level (computed): ${metrics.level}

Produce:
1. A plain-language diagnosis of why usage is at this level — what the numbers and the description suggest (e.g. behavior genuinely stuck, dependency failure, lack of reliance, low perceived value). Be concrete and specific to this workflow, not generic.
2. A single, concrete next action for the account manager or CSM to take.`;
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
  const workflowId = body.workflowId as string;
  const workflow = getAdoptionWorkflowById(workflowId);

  if (!workflow) {
    return NextResponse.json({ error: { kind: "not_found", message: "Workflow not found." } }, { status: 404 });
  }

  try {
    const assessment = await callStructured(AdoptionAssessmentSchema, buildPrompt(workflow));
    const updated = setAdoptionAssessment(workflow.id, assessment);
    return NextResponse.json({ workflow: updated, metrics: computeAdoptionMetrics(workflow) });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ error: { kind, message } }, { status: 502 });
  }
}
