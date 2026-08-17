import { NextResponse } from "next/server";
import { callStructured, classifyError } from "@/lib/ai";
import { SurveyAnalysisSchema } from "@/lib/schemas/survey-analysis";
import { addSurveyResponse, setSurveyResponseAnalysis } from "@/lib/store/survey-responses";

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

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { kind: "invalid_body", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }
  const answers = {
    toolsUsed: body.toolsUsed as string,
    whatFor: body.whatFor as string,
    howOften: body.howOften as string,
  };

  const surveyResponse = addSurveyResponse(answers);

  try {
    const analysis = await callStructured(SurveyAnalysisSchema, buildPrompt(answers));
    const updated = setSurveyResponseAnalysis(surveyResponse.id, analysis);
    return NextResponse.json({ response: updated });
  } catch (error) {
    const { kind, message } = classifyError(error);
    return NextResponse.json({ response: surveyResponse, error: { kind, message } }, { status: 502 });
  }
}
