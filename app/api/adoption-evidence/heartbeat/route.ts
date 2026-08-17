import { NextResponse } from "next/server";
import {
  computeAdoptionMetrics,
  getAdoptionWorkflowById,
  recordHeartbeat,
} from "@/lib/store/adoption-workflows";

/**
 * The endpoint an instrumented workflow would ping after every run. In the demo the
 * "Simulate run" button calls it to show a heartbeat arriving and the score reacting.
 */
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
  const existing = getAdoptionWorkflowById(workflowId);

  if (!existing) {
    return NextResponse.json({ error: { kind: "not_found", message: "Workflow not found." } }, { status: 404 });
  }

  const updated = recordHeartbeat(workflowId);
  return NextResponse.json({ workflow: updated, metrics: computeAdoptionMetrics(updated!) });
}
