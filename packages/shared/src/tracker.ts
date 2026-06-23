import { z } from "zod";
import { jobBoardProviderSchema } from "./jobs";

export const trackerSourceSchema = z.object({
  provider: jobBoardProviderSchema,
  slug: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(120),
});
export type TrackerSource = z.infer<typeof trackerSourceSchema>;

export const createTrackerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  productDescription: z.string().trim().min(10).max(2000),
  signalHypothesis: z.string().trim().min(10).max(2000),
  keywords: z.array(z.string().trim().min(1).max(80)).max(25).default([]),
  locations: z.array(z.string().trim().min(1).max(80)).max(25).default([]),
  sources: z.array(trackerSourceSchema).min(1).max(20),
});
export type CreateTrackerInput = z.infer<typeof createTrackerSchema>;

export const updateTrackerSchema = createTrackerSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateTrackerInput = z.infer<typeof updateTrackerSchema>;

export interface Tracker {
  id: string;
  name: string;
  productDescription: string;
  signalHypothesis: string;
  keywords: string[];
  locations: string[];
  sources: TrackerSource[];
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}
