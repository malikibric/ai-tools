import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, notFound, readJsonBody } from "@/lib/http";
import {
  computeAdoptionMetrics,
  getAdoptionWorkflowById,
  recordHeartbeat,
} from "@/lib/tools/adoption-evidence/store";

const RequestSchema = z.object({ workflowId: z.string().min(1) });

/**
 * The endpoint an instrumented workflow would ping after every run. In the demo the
 * "Simulate run" button calls it to show a heartbeat arriving and the score reacting.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request, RequestSchema);
  if (!body) return badRequest("workflowId is required.");

  const existing = getAdoptionWorkflowById(body.workflowId);
  if (!existing) return notFound("Workflow not found.");

  const updated = recordHeartbeat(body.workflowId);
  if (!updated) return notFound("Workflow not found.");

  return NextResponse.json({ workflow: updated, metrics: computeAdoptionMetrics(updated) });
}
