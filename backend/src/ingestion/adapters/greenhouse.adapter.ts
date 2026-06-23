import { Injectable } from '@nestjs/common';
import type {
  JobBoardProvider,
  NormalizedJobPosting,
} from '@signalscout/shared';
import type { JobBoardAdapter } from '../job-board.adapter';
import { fetchJson, stripHtml, truncate } from '../http.util';

interface GreenhouseResponse {
  jobs?: Array<{
    id: number;
    title: string;
    location?: { name?: string } | null;
    content?: string;
    absolute_url: string;
    updated_at?: string;
  }>;
}

@Injectable()
export class GreenhouseAdapter implements JobBoardAdapter {
  readonly provider: JobBoardProvider = 'greenhouse';

  async fetchPostings(
    slug: string,
    companyName: string,
  ): Promise<NormalizedJobPosting[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
    const data = await fetchJson<GreenhouseResponse>(url);

    return (data.jobs ?? []).map((job) => ({
      provider: this.provider,
      externalId: String(job.id),
      company: companyName,
      companySlug: slug,
      title: job.title,
      location: job.location?.name ?? null,
      description: truncate(stripHtml(job.content ?? '')),
      url: job.absolute_url,
      postedAt: job.updated_at ?? null,
    }));
  }
}
