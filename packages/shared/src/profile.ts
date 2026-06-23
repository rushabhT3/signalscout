import { z } from "zod";
import type { PlanTier } from "./plans";

export interface PublicProfile {
  id: string;
  email: string;
  fullName: string | null;
  planTier: PlanTier;
  creditsBalance: number;
  creditsResetAt: string;
  subscriptionStatus: string | null;
  createdAt: string;
}

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
