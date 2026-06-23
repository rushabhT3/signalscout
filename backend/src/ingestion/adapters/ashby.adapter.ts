import { Injectable } from '@nestjs/common';
import type {
  JobBoardProvider,
  NormalizedJobPosting,
} from '@signalscout/shared';
import type { JobBoardAdapter } from '../job-board.adapter';
import { fetchJson, stripHtml, truncate } from '../http.util';

interface AshbyResponse {
  jobs?: Array<{
    id: string;
    title: string;
    location?: string;
    descriptionPlain?: string;
    descriptionHtml?: string;
    jobUrl?: string;
    applyUrl?: string;
    publishedAt?: string;
    isListed?: boolean;
  }>;
}

@Injectable()
export class AshbyAdapter implements JobBoardAdapter {
  readonly provider: JobBoardProvider = 'ashby';

  async fetchPostings(
    slug: string,
    companyName: string,
  ): Promise<NormalizedJobPosting[]> {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=false`;
    const data = await fetchJson<AshbyResponse>(url);

    return (data.jobs ?? [])
      .filter((job) => job.isListed !== false)
      .map((job) => ({
        provider: this.provider,
        externalId: job.id,
        company: companyName,
        companySlug: slug,
        title: job.title,
        location: job.location ?? null,
        description: truncate(
          job.descriptionPlain ?? stripHtml(job.descriptionHtml ?? ''),
        ),
        url: job.jobUrl ?? job.applyUrl ?? `https://jobs.ashbyhq.com/${slug}`,
        postedAt: job.publishedAt ?? null,
      }));
  }
}
