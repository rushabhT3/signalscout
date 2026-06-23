import { Injectable } from "@nestjs/common";
import type { JobBoardProvider, NormalizedJobPosting } from "@signalscout/shared";
import type { JobBoardAdapter } from "../job-board.adapter";
import { fetchJson, stripHtml, truncate } from "../http.util";

interface LeverPosting {
  id: string;
  text: string;
  categories?: { location?: string; team?: string; commitment?: string };
  descriptionPlain?: string;
  description?: string;
  hostedUrl: string;
  createdAt?: number;
}

@Injectable()
export class LeverAdapter implements JobBoardAdapter {
  readonly provider: JobBoardProvider = "lever";

  async fetchPostings(slug: string, companyName: string): Promise<NormalizedJobPosting[]> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
    const data = await fetchJson<LeverPosting[]>(url);

    return (data ?? []).map((posting) => ({
      provider: this.provider,
      externalId: posting.id,
      company: companyName,
      companySlug: slug,
      title: posting.text,
      location: posting.categories?.location ?? null,
      description: truncate(posting.descriptionPlain ?? stripHtml(posting.description ?? "")),
      url: posting.hostedUrl,
      postedAt: posting.createdAt ? new Date(posting.createdAt).toISOString() : null,
    }));
  }
}
