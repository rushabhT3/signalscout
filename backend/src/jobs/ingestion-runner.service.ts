import { Injectable, Logger } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import { SignalsService } from "../signals/signals.service";
import { TrackerRepository } from "../trackers/tracker.repository";

export interface IngestionSweepSummary {
  trackersProcessed: number;
  trackersFailed: number;
  postingsIngested: number;
  evaluated: number;
  matches: number;
}

@Injectable()
export class IngestionRunnerService {
  private readonly logger = new Logger(IngestionRunnerService.name);
  private isRunning = false;

  constructor(
    private readonly trackers: TrackerRepository,
    private readonly signals: SignalsService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Runs every active tracker in bounded batches. A single overlap guard makes
   * the sweep safe to trigger from both the in-process cron and Cloud Scheduler.
   */
  async runAllActive(): Promise<IngestionSweepSummary> {
    const empty: IngestionSweepSummary = {
      trackersProcessed: 0,
      trackersFailed: 0,
      postingsIngested: 0,
      evaluated: 0,
      matches: 0,
    };

    if (this.isRunning) {
      this.logger.warn("Ingestion sweep already in progress; skipping this trigger.");
      return empty;
    }

    this.isRunning = true;
    const summary = { ...empty };
    try {
      const active = await this.trackers.listActive();
      const batchSize = this.config.ingestion.batchSize;

      for (let start = 0; start < active.length; start += batchSize) {
        const batch = active.slice(start, start + batchSize);
        const results = await Promise.allSettled(
          batch.map((tracker) => this.signals.runTracker(tracker.userId, tracker.id)),
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            summary.trackersProcessed += 1;
            summary.postingsIngested += result.value.postingsIngested;
            summary.evaluated += result.value.evaluated;
            summary.matches += result.value.matches;
          } else {
            summary.trackersFailed += 1;
            this.logger.error(`Tracker run failed: ${String(result.reason)}`);
          }
        }
      }

      this.logger.log(`Ingestion sweep complete: ${JSON.stringify(summary)}`);
      return summary;
    } finally {
      this.isRunning = false;
    }
  }
}
