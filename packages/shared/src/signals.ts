import { z } from "zod";
import { leadStatusSchema, type LeadStatus } from "./leads";
import type { OutreachDraft } from "./outreach";

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

const booleanQueryParam = z.union([
  z.boolean(),
  z.enum(["true", "false"]).transform((value) => value === "true"),
]);

export const signalListQuerySchema = z.object({
  trackerId: z.uuid().optional(),
  status: leadStatusSchema.optional(),
  matchesOnly: booleanQueryParam.default(true),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type SignalListQuery = z.infer<typeof signalListQuerySchema>;

export const updateSignalSchema = z.object({ status: leadStatusSchema });
export type UpdateSignalInput = z.infer<typeof updateSignalSchema>;

/** A signal as exposed to the frontend (camelCase, outreach parsed). */
export interface SignalView {
  id: string;
  trackerId: string;
  company: string;
  title: string;
  location: string | null;
  url: string;
  postedAt: string | null;
  isMatch: boolean;
  confidence: number;
  category: SignalCategory;
  reasoning: string;
  likelyNeed: string;
  suggestedAngle: string;
  status: LeadStatus;
  outreach: OutreachDraft | null;
  createdAt: string;
}

export interface TrackerRunResult {
  trackerId: string;
  postingsIngested: number;
  evaluated: number;
  matches: number;
  creditsSpent: number;
  skippedInsufficientCredits: boolean;
}
