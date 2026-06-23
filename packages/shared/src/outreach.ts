import { z } from "zod";

export const OUTREACH_TONES = ["direct", "consultative", "casual"] as const;
export const outreachToneSchema = z.enum(OUTREACH_TONES);
export type OutreachTone = z.infer<typeof outreachToneSchema>;

export const OUTREACH_TONE_LABELS: Record<OutreachTone, string> = {
  direct: "Direct",
  consultative: "Consultative",
  casual: "Casual",
};

/**
 * Structured output contract for an AI-drafted outreach sequence tied to a signal.
 */
export const outreachDraftSchema = z.object({
  subject: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  followUp: z.string().min(1).max(1000),
});

export type OutreachDraft = z.infer<typeof outreachDraftSchema>;
