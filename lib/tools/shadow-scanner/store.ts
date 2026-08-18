import { randomUUID } from "crypto";
import { isNotFoundError, prisma } from "@/lib/db";
import type { SurveyAnalysis } from "./schema";

export type SurveyResponse = {
  id: string;
  answers: {
    toolsUsed: string;
    whatFor: string;
    howOften: string;
  };
  analysis: SurveyAnalysis | null;
};

function fromRow(r: {
  id: string;
  toolsUsed: string;
  whatFor: string;
  howOften: string;
  analysis: unknown;
}): SurveyResponse {
  return {
    id: r.id,
    answers: { toolsUsed: r.toolsUsed, whatFor: r.whatFor, howOften: r.howOften },
    analysis: (r.analysis as SurveyAnalysis) ?? null,
  };
}

export async function getSurveyResponses(): Promise<SurveyResponse[]> {
  return (await prisma.surveyResponse.findMany({ orderBy: { id: "asc" } })).map(fromRow);
}

export async function getSurveyResponseById(id: string): Promise<SurveyResponse | null> {
  const r = await prisma.surveyResponse.findUnique({ where: { id } });
  return r ? fromRow(r) : null;
}

export type SurveyInput = {
  id?: string;
  toolsUsed: string;
  whatFor: string;
  howOften: string;
};

export async function createSurveyResponse(input: SurveyInput): Promise<SurveyResponse> {
  const r = await prisma.surveyResponse.create({
    data: {
      id: input.id ?? `resp-${randomUUID().slice(0, 8)}`,
      toolsUsed: input.toolsUsed,
      whatFor: input.whatFor,
      howOften: input.howOften,
    },
  });
  return fromRow(r);
}

export async function updateSurveyResponse(id: string, input: SurveyInput): Promise<SurveyResponse | null> {
  try {
    const r = await prisma.surveyResponse.update({
      where: { id },
      data: { toolsUsed: input.toolsUsed, whatFor: input.whatFor, howOften: input.howOften },
    });
    return fromRow(r);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function setSurveyResponseAnalysis(id: string, analysis: SurveyAnalysis): Promise<SurveyResponse | null> {
  try {
    const r = await prisma.surveyResponse.update({ where: { id }, data: { analysis } });
    return fromRow(r);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function deleteSurveyResponse(id: string): Promise<void> {
  try {
    await prisma.surveyResponse.delete({ where: { id } });
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }
}
