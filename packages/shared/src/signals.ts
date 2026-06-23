import { z } from "zod";

export const SIGNAL_CATEGORIES = [
  "hiring_surge",
  "first_role_of_type",
  "leadership_hire",
  "team_expansion",
  "tech_adoption",
  "geographic_expansion",
  "not_a_match",
] as const;

export const signalCategorySchema = z.enum(SIGNAL_CATEGORIES);
export type SignalCategory = z.infer<typeof signalCategorySchema>;

export const SIGNAL_CATEGORY_LABELS: Record<SignalCategory, string> = {
  hiring_surge: "Hiring surge",
  first_role_of_type: "First role of its kind",
  leadership_hire: "Leadership hire",
  team_expansion: "Team expansion",
  tech_adoption: "New tech adoption",
  geographic_expansion: "Geographic expansion",
  not_a_match: "Not a match",
};

/**
 * Structured output contract the LLM MUST return when evaluating a job posting
 * against a tracker's signal hypothesis. Used both to constrain Gemini's response
 * schema and to validate it before persistence.
 */
export const signalEvaluationSchema = z.object({
  isMatch: z.boolean(),
  confidence: z.number().int().min(0).max(100),
  category: signalCategorySchema,
  reasoning: z.string().min(1).max(800),
  likelyNeed: z.string().min(1).max(400),
  suggestedAngle: z.string().min(1).max(400),
});

export type SignalEvaluation = z.infer<typeof signalEvaluationSchema>;
