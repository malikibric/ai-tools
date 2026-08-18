import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, notFound, readJsonBody, withDbErrors } from "@/lib/http";
import {
  deleteAdoptionWorkflow,
  updateAdoptionWorkflow,
  type AdoptionWorkflowInput,
} from "@/lib/tools/adoption-evidence/store";

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  owner: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  claimedRunsPerWeek: z.coerce.number().max(100_000).optional(),
  claimedMinutesPerRun: z.coerce.number().max(100_000).optional(),
  weeklyRuns: z.array(z.number()).max(52).optional(),
  lastRunAt: z.string().max(100).nullable().optional(),
});

export const PUT = withDbErrors(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await readJsonBody(request, UpdateSchema);
  if (!body) return badRequest("No valid fields provided.");
  const workflow = await updateAdoptionWorkflow(id, body as Partial<AdoptionWorkflowInput>);
  if (!workflow) return notFound("Workflow not found.");
  return NextResponse.json({ workflow });
});

export const DELETE = withDbErrors(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await deleteAdoptionWorkflow(id);
  return NextResponse.json({ ok: true });
});
