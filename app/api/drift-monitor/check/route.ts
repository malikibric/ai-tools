import { NextResponse } from "next/server";
import { z } from "zod";
import { callStructured, classifyError } from "@/lib/ai";
import { badRequest, notFound, readJsonBody } from "@/lib/http";
import { DriftAssessmentSchema } from "@/lib/tools/drift-monitor/schema";
import { getWorkflowById, updateWorkflowAssessment, type Workflow } from "@/lib/tools/drift-monitor/store";

const RequestSchema = z.object({ workflowId: z.string().min(1) });

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
  const body = await readJsonBody(request, RequestSchema);
  if (!body) return badRequest("workflowId is required.");

  const workflow = await getWorkflowById(body.workflowId);
  if (!workflow) return notFound("Workflow not found.");

  try {
    const assessment = await callStructured(DriftAssessmentSchema, buildPrompt(workflow));
    const updated = await updateWorkflowAssessment(workflow.id, assessment);
    return NextResponse.json({ workflow: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ error: { kind, message } }, { status: 502 });
  }
}
