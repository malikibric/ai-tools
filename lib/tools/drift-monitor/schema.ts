import { z } from "zod";

export const DriftAssessmentSchema = z.object({
  riskLevel: z.enum(["healthy", "at_risk", "broken"]),
  dependencyChangeLikelihood: z.string(),
  descriptionConsistency: z.string(),
  suggestedNextAction: z.string(),
});

export type DriftAssessment = z.infer<typeof DriftAssessmentSchema>;
