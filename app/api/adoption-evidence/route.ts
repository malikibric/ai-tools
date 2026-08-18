import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, readJsonBody, withDbErrors } from "@/lib/http";
import {
  createAdoptionWorkflow,
  getAdoptionWorkflows,
  summarizeAdoption,
  type AdoptionWorkflowInput,
} from "@/lib/tools/adoption-evidence/store";

const CreateSchema = z.object({
  id: z.string().max(100).optional(),
  name: z.string().min(1).max(200),
  owner: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  claimedRunsPerWeek: z.coerce.number().int().positive().max(100_000),
  claimedMinutesPerRun: z.coerce.number().int().positive().max(100_000),
  weeklyRuns: z.array(z.number()).max(52).optional(),
  lastRunAt: z.string().max(100).optional(),
});

export const GET = withDbErrors(async () => {
  const workflows = await getAdoptionWorkflows();
  return NextResponse.json({ workflows, summary: summarizeAdoption(workflows) });
});

export const POST = withDbErrors(async (request: Request) => {
  const body = await readJsonBody(request, CreateSchema);
  if (!body) return badRequest("All workflow fields are required.");
  const workflow = await createAdoptionWorkflow(body as AdoptionWorkflowInput);
  return NextResponse.json({ workflow });
});
