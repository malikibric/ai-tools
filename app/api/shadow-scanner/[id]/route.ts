import { NextResponse } from "next/server";
import { z } from "zod";
import { callStructured, classifyError } from "@/lib/ai";
import { badRequest, notFound, readJsonBody, withDbErrors } from "@/lib/http";
import { SurveyAnalysisSchema } from "@/lib/tools/shadow-scanner/schema";
import { buildSurveyPrompt } from "@/lib/tools/shadow-scanner/prompt";
import {
  deleteSurveyResponse,
  getSurveyResponseById,
  setSurveyResponseAnalysis,
  updateSurveyResponse,
  type SurveyInput,
} from "@/lib/tools/shadow-scanner/store";

const UpdateSchema = z.object({
  toolsUsed: z.string().min(1).max(2000),
  whatFor: z.string().min(1).max(2000),
  howOften: z.string().min(1).max(500),
});

export const PUT = withDbErrors(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await readJsonBody(request, UpdateSchema);
  if (!body) return badRequest("All three survey answers are required.");

  const existing = await getSurveyResponseById(id);
  if (!existing) return notFound("Response not found.");

  const updated = await updateSurveyResponse(id, body as SurveyInput);
  try {
    const analysis = await callStructured(SurveyAnalysisSchema, buildSurveyPrompt(body));
    const withAnalysis = await setSurveyResponseAnalysis(id, analysis);
    return NextResponse.json({ response: withAnalysis });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ response: updated, error: { kind, message } }, { status: 502 });
  }
});

export const DELETE = withDbErrors(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await deleteSurveyResponse(id);
  return NextResponse.json({ ok: true });
});
