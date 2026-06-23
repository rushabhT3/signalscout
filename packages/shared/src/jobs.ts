import { z } from "zod";

export const JOB_BOARD_PROVIDERS = ["greenhouse", "lever", "ashby"] as const;
export const jobBoardProviderSchema = z.enum(JOB_BOARD_PROVIDERS);
export type JobBoardProvider = z.infer<typeof jobBoardProviderSchema>;

export const JOB_BOARD_PROVIDER_LABELS: Record<JobBoardProvider, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
};

/**
 * Provider-agnostic shape every job-board adapter normalizes raw postings into.
 * Keeps ingestion adapters interchangeable (Open/Closed + Dependency Inversion).
 */
export interface NormalizedJobPosting {
  provider: JobBoardProvider;
  externalId: string;
  company: string;
  companySlug: string;
  title: string;
  location: string | null;
  description: string;
  url: string;
  postedAt: string | null;
}
