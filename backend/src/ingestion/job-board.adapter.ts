import type { JobBoardProvider, NormalizedJobPosting } from "@signalscout/shared";

/**
 * Contract every job-board integration implements. New providers are added by
 * writing a new adapter and registering it — no existing code changes (OCP).
 */
export interface JobBoardAdapter {
  readonly provider: JobBoardProvider;
  fetchPostings(slug: string, companyName: string): Promise<NormalizedJobPosting[]>;
}

export const JOB_BOARD_ADAPTERS = Symbol("JOB_BOARD_ADAPTERS");
