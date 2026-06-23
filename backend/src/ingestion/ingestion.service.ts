import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { NormalizedJobPosting, TrackerSource } from '@signalscout/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { JobBoardRegistry } from './job-board.registry';

export interface IngestedPosting {
  id: string;
  company: string;
  title: string;
  location: string | null;
  url: string;
  postedAt: string | null;
  description: string;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly registry: JobBoardRegistry,
    private readonly supabase: SupabaseService,
  ) {}

  /**
   * Fetches postings from every source, upserts them (dedup on provider+external_id),
   * and returns the persisted rows. A failing source is logged and skipped so one
   * broken board never sinks the whole run.
   */
  async ingestForSources(sources: TrackerSource[]): Promise<IngestedPosting[]> {
    const collected: NormalizedJobPosting[] = [];

    for (const source of sources) {
      try {
        const adapter = this.registry.get(source.provider);
        const postings = await adapter.fetchPostings(source.slug, source.label);
        collected.push(...postings);
      } catch (error) {
        this.logger.warn(
          `Ingestion failed for ${source.provider}/${source.slug}: ${(error as Error).message}`,
        );
      }
    }

    if (collected.length === 0) {
      return [];
    }

    const rows = collected.map((posting) => ({
      provider: posting.provider,
      external_id: posting.externalId,
      company: posting.company,
      company_slug: posting.companySlug,
      title: posting.title,
      location: posting.location,
      description: posting.description,
      url: posting.url,
      posted_at: posting.postedAt,
      content_hash: this.hash(posting),
    }));

    const { data, error } = await this.supabase.admin
      .from('job_postings')
      .upsert(rows, { onConflict: 'provider,external_id' })
      .select('id, company, title, location, url, posted_at, description');

    if (error) {
      throw new Error(`Failed to persist job postings: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      company: row.company,
      title: row.title,
      location: row.location,
      url: row.url,
      postedAt: row.posted_at,
      description: row.description,
    }));
  }

  private hash(posting: NormalizedJobPosting): string {
    return createHash('sha256')
      .update(`${posting.title}\n${posting.description}`)
      .digest('hex');
  }
}
