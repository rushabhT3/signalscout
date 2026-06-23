import { z } from "zod";

export const LEAD_STATUSES = ["new", "saved", "contacted", "archived"] as const;
export const leadStatusSchema = z.enum(LEAD_STATUSES);
export type LeadStatus = z.infer<typeof leadStatusSchema>;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  saved: "Saved",
  contacted: "Contacted",
  archived: "Archived",
};
