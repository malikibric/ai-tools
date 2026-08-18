import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, readJsonBody } from "@/lib/http";
import {
  createAdoptionWorkflow,
  getAdoptionWorkflows,
  summarizeAdoption,
  type AdoptionWorkflowInput,
} from "@/lib/tools/adoption-evidence/store";

const CreateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  owner: z.string().min(1),
  description: z.string().min(1),
  claimedRunsPerWeek: z.coerce.number().int().positive(),
  claimedMinutesPerRun: z.coerce.number().int().positive(),
  weeklyRuns: z.array(z.number()).optional(),
  lastRunAt: z.string().optional(),
});

export async function GET() {
  const workflows = await getAdoptionWorkflows();
  return NextResponse.json({ workflows, summary: summarizeAdoption(workflows) });
}

export async function POST(request: Request) {
  const body = await readJsonBody(request, CreateSchema);
  if (!body) return badRequest("All workflow fields are required.");
  const workflow = await createAdoptionWorkflow(body as AdoptionWorkflowInput);
  return NextResponse.json({ workflow });
}
