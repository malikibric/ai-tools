import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, readJsonBody } from "@/lib/http";
import { createWorkflow, getWorkflows, type DriftWorkflowInput } from "@/lib/tools/drift-monitor/store";

const CreateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  owner: z.string().min(1),
  description: z.string().min(1),
  dependencies: z.array(z.string()).optional(),
  dateApproved: z.string().min(1),
  lastVerified: z.string().min(1),
});

export async function GET() {
  return NextResponse.json({ workflows: await getWorkflows() });
}

export async function POST(request: Request) {
  const body = await readJsonBody(request, CreateSchema);
  if (!body) return badRequest("All workflow fields are required.");
  const workflow = await createWorkflow(body as DriftWorkflowInput);
  return NextResponse.json({ workflow });
}
