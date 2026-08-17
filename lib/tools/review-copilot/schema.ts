import { z } from "zod";

export const ReviewBriefSchema = z.object({
  plainLanguageExplanation: z.string(),
  managerQuestions: z.array(z.string()).min(3).max(5),
  riskFlags: z.array(z.string()),
  recommendation: z.enum(["approve", "approve_with_changes", "needs_discussion"]),
  recommendationReasoning: z.string(),
});

export type ReviewBrief = z.infer<typeof ReviewBriefSchema>;
