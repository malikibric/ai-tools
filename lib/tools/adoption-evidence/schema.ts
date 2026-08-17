import { z } from "zod";

export const AdoptionAssessmentSchema = z.object({
  diagnosis: z.string(),
  suggestedIntervention: z.string(),
});

export type AdoptionAssessment = z.infer<typeof AdoptionAssessmentSchema>;
