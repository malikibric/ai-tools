import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, notFound, readJsonBody, withDbErrors } from "@/lib/http";
import { computeAdoptionMetrics, recordHeartbeat } from "@/lib/tools/adoption-evidence/store";

const RequestSchema = z.object({ workflowId: z.string().min(1) });

export const POST = withDbErrors(async (request: Request) => {
  const body = await readJsonBody(request, RequestSchema);
  if (!body) return badRequest("workflowId is required.");

  const updated = await recordHeartbeat(body.workflowId);
  if (!updated) return notFound("Workflow not found.");

  return NextResponse.json({ workflow: updated, metrics: computeAdoptionMetrics(updated) });
});
