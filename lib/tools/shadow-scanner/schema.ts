import { z } from "zod";

export const SurveyAnalysisSchema = z.object({
  toolsMentioned: z.array(z.string()),
  useCaseCategory: z.string(),
  riskFlag: z.string().nullable(),
  summary: z.string(),
});

export type SurveyAnalysis = z.infer<typeof SurveyAnalysisSchema>;
