import { NextResponse } from "next/server";
import { z } from "zod";
import { callStructured, classifyError } from "@/lib/ai";
import { badRequest, readJsonBody, withDbErrors } from "@/lib/http";
import { SurveyAnalysisSchema } from "@/lib/tools/shadow-scanner/schema";
import { buildSurveyPrompt } from "@/lib/tools/shadow-scanner/prompt";
import { createSurveyResponse, getSurveyResponses, setSurveyResponseAnalysis } from "@/lib/tools/shadow-scanner/store";

const AnswersSchema = z.object({
  toolsUsed: z.string().min(1).max(2000),
  whatFor: z.string().min(1).max(2000),
  howOften: z.string().min(1).max(500),
});

export const GET = withDbErrors(async () => {
  return NextResponse.json({ responses: await getSurveyResponses() });
});

export const POST = withDbErrors(async (request: Request) => {
  const body = await readJsonBody(request, AnswersSchema);
  if (!body) return badRequest("All three survey answers are required.");

  const response = await createSurveyResponse(body);
  try {
    const analysis = await callStructured(SurveyAnalysisSchema, buildSurveyPrompt(body));
    const updated = await setSurveyResponseAnalysis(response.id, analysis);
    return NextResponse.json({ response: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ response, error: { kind, message } }, { status: 502 });
  }
});
