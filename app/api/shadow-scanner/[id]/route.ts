import { NextResponse } from "next/server";
import { z } from "zod";
import { callStructured, classifyError } from "@/lib/ai";
import { badRequest, notFound, readJsonBody } from "@/lib/http";
import { SurveyAnalysisSchema } from "@/lib/tools/shadow-scanner/schema";
import {
  deleteSurveyResponse,
  getSurveyResponseById,
  setSurveyResponseAnalysis,
  updateSurveyResponse,
  type SurveyInput,
} from "@/lib/tools/shadow-scanner/store";

const UpdateSchema = z.object({
  toolsUsed: z.string().min(1),
  whatFor: z.string().min(1),
  howOften: z.string().min(1),
});

function buildPrompt(answers: { toolsUsed: string; whatFor: string; howOften: string }) {
  return `An employee answered a short survey about informal AI tool usage at work.

What AI tools have you used at work in the last month? ${answers.toolsUsed}
What did you use them for? ${answers.whatFor}
How often? ${answers.howOften}

Extract:
1. The specific AI tools mentioned, as a list.
2. A short use-case category (e.g. "Internal communications", "Software development", "Client document review").
3. An informal-usage risk flag if the response suggests sensitive data handling, no oversight, or use of an unvetted personal/consumer tool for work data — otherwise null.
4. A one-line summary of the response.`;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJsonBody(request, UpdateSchema);
  if (!body) return badRequest("All three survey answers are required.");

  const existing = await getSurveyResponseById(id);
  if (!existing) return notFound("Response not found.");

  const updated = await updateSurveyResponse(id, body as SurveyInput);
  try {
    const analysis = await callStructured(SurveyAnalysisSchema, buildPrompt(body));
    const withAnalysis = await setSurveyResponseAnalysis(id, analysis);
    return NextResponse.json({ response: withAnalysis });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ response: updated, error: { kind, message } }, { status: 502 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteSurveyResponse(id);
  return NextResponse.json({ ok: true });
}
