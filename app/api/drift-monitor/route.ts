import { NextResponse } from "next/server";
import { callStructured, classifyError } from "@/lib/ai";
import { DriftAssessmentSchema } from "@/lib/schemas/drift-assessment";
import { getWorkflowById, updateWorkflowAssessment, type Workflow } from "@/lib/store/workflows";

function buildPrompt(workflow: Workflow) {
  return `You are assessing whether an internal AI-assisted workflow has drifted since it was approved.

Workflow name: ${workflow.name}
Owner: ${workflow.owner}
Description (including how it is currently described as being used): ${workflow.description}
Dependencies (tools/APIs/systems it relies on): ${workflow.dependencies.join("; ")}
Date approved: ${workflow.dateApproved}
Last verified: ${workflow.lastVerified}

Assess:
1. Whether anything in the dependency list has likely changed or become unreliable.
2. Whether the description is internally consistent with how the workflow is described as still being used today.
3. An overall risk level: "healthy" if nothing suggests a problem, "at_risk" if there are signs of possible drift, "broken" if a dependency is clearly no longer viable (e.g. explicitly deprecated or shut down).
4. A single, concrete next action someone should take.`;
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
  const workflow = getWorkflowById(workflowId);

  if (!workflow) {
    return NextResponse.json({ error: { kind: "not_found", message: "Workflow not found." } }, { status: 404 });
  }

  try {
    const assessment = await callStructured(DriftAssessmentSchema, buildPrompt(workflow));
    const updated = updateWorkflowAssessment(workflow.id, assessment);
    return NextResponse.json({ workflow: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ error: { kind, message } }, { status: 502 });
  }
}
