import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, notFound, readJsonBody } from "@/lib/http";
import { deleteWorkflow, updateWorkflow, type DriftWorkflowInput } from "@/lib/tools/drift-monitor/store";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  owner: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dependencies: z.array(z.string()).optional(),
  dateApproved: z.string().min(1).optional(),
  lastVerified: z.string().min(1).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJsonBody(request, UpdateSchema);
  if (!body) return badRequest("No valid fields provided.");
  const workflow = await updateWorkflow(id, body as Partial<DriftWorkflowInput>);
  if (!workflow) return notFound("Workflow not found.");
  return NextResponse.json({ workflow });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteWorkflow(id);
  return NextResponse.json({ ok: true });
}
