import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, readJsonBody, withDbErrors } from "@/lib/http";
import { createWorkflow, getWorkflows, type DriftWorkflowInput } from "@/lib/tools/drift-monitor/store";

const CreateSchema = z.object({
  id: z.string().max(100).optional(),
  name: z.string().min(1).max(200),
  owner: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  dependencies: z.array(z.string().max(200)).max(50).optional(),
  dateApproved: z.string().min(1).max(100),
  lastVerified: z.string().min(1).max(100),
});

export const GET = withDbErrors(async () => {
  return NextResponse.json({ workflows: await getWorkflows() });
});

export const POST = withDbErrors(async (request: Request) => {
  const body = await readJsonBody(request, CreateSchema);
  if (!body) return badRequest("All workflow fields are required.");
  const workflow = await createWorkflow(body as DriftWorkflowInput);
  return NextResponse.json({ workflow });
});
