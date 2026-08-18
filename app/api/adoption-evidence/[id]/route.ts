import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, notFound, readJsonBody } from "@/lib/http";
import {
  deleteAdoptionWorkflow,
  updateAdoptionWorkflow,
  type AdoptionWorkflowInput,
} from "@/lib/tools/adoption-evidence/store";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  owner: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  claimedRunsPerWeek: z.coerce.number().optional(),
  claimedMinutesPerRun: z.coerce.number().optional(),
  weeklyRuns: z.array(z.number()).optional(),
  lastRunAt: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJsonBody(request, UpdateSchema);
  if (!body) return badRequest("No valid fields provided.");
  const workflow = await updateAdoptionWorkflow(id, body as Partial<AdoptionWorkflowInput>);
  if (!workflow) return notFound("Workflow not found.");
  return NextResponse.json({ workflow });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteAdoptionWorkflow(id);
  return NextResponse.json({ ok: true });
}
