import { Inject, Injectable } from "@nestjs/common";
import type { JobBoardProvider } from "@signalscout/shared";
import { JOB_BOARD_ADAPTERS, type JobBoardAdapter } from "./job-board.adapter";

@Injectable()
export class JobBoardRegistry {
  private readonly byProvider: Map<JobBoardProvider, JobBoardAdapter>;

  constructor(@Inject(JOB_BOARD_ADAPTERS) adapters: JobBoardAdapter[]) {
    this.byProvider = new Map(adapters.map((adapter) => [adapter.provider, adapter]));
  }

  get(provider: JobBoardProvider): JobBoardAdapter {
    const adapter = this.byProvider.get(provider);
    if (!adapter) {
      throw new Error(`No job-board adapter registered for provider "${provider}".`);
    }
    return adapter;
  }
}
