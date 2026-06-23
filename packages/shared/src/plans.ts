import { z } from "zod";

export const PLAN_TIERS = ["free", "pro"] as const;
export const planTierSchema = z.enum(PLAN_TIERS);
export type PlanTier = z.infer<typeof planTierSchema>;

export interface PlanLimits {
  monthlyCredits: number;
  maxTrackers: number;
  label: string;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { monthlyCredits: 50, maxTrackers: 2, label: "Free" },
  pro: { monthlyCredits: 1000, maxTrackers: 25, label: "Pro" },
};

/** Credit cost per metered operation. Centralized so pricing logic has one source of truth. */
export const CREDIT_COSTS = {
  signalEvaluation: 1,
  outreachDraft: 2,
} as const;

export type MeteredOperation = keyof typeof CREDIT_COSTS;
