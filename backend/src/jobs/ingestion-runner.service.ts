import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { EmailService } from '../email/email.service';
import { ProfileRepository } from '../profiles/profile.repository';
import { SignalsService } from '../signals/signals.service';
import { TrackerRepository } from '../trackers/tracker.repository';

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
    private readonly profiles: ProfileRepository,
    private readonly email: EmailService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Runs every active tracker in bounded batches, then emails each user a digest
   * of their new matches. A single overlap guard makes the sweep safe to trigger
   * from both the in-process cron and Cloud Scheduler.
   */
  async runAllActive(): Promise<IngestionSweepSummary> {
    const summary: IngestionSweepSummary = {
      trackersProcessed: 0,
      trackersFailed: 0,
      postingsIngested: 0,
      evaluated: 0,
      matches: 0,
    };

    if (this.isRunning) {
      this.logger.warn(
        'Ingestion sweep already in progress; skipping this trigger.',
      );
      return summary;
    }

    this.isRunning = true;
    const matchesByUser = new Map<string, number>();
    try {
      const active = await this.trackers.listActive();
      const batchSize = this.config.ingestion.batchSize;

      for (let start = 0; start < active.length; start += batchSize) {
        const batch = active.slice(start, start + batchSize);
        const settled = await Promise.allSettled(
          batch.map((tracker) =>
            this.signals
              .runTracker(tracker.userId, tracker.id)
              .then((result) => ({ userId: tracker.userId, result })),
          ),
        );

        for (const outcome of settled) {
          if (outcome.status === 'fulfilled') {
            const { userId, result } = outcome.value;
            summary.trackersProcessed += 1;
            summary.postingsIngested += result.postingsIngested;
            summary.evaluated += result.evaluated;
            summary.matches += result.matches;
            if (result.matches > 0) {
              matchesByUser.set(
                userId,
                (matchesByUser.get(userId) ?? 0) + result.matches,
              );
            }
          } else {
            summary.trackersFailed += 1;
            this.logger.error(`Tracker run failed: ${String(outcome.reason)}`);
          }
        }
      }

      await this.sendDigests(matchesByUser);
      this.logger.log(`Ingestion sweep complete: ${JSON.stringify(summary)}`);
      return summary;
    } finally {
      this.isRunning = false;
    }
  }

  private async sendDigests(matchesByUser: Map<string, number>): Promise<void> {
    if (!this.email.enabled || matchesByUser.size === 0) {
      return;
    }
    const dashboardUrl = `${this.config.frontendUrl}/dashboard`;
    for (const [userId, matches] of matchesByUser) {
      const profile = await this.profiles.findById(userId);
      if (profile) {
        await this.email.sendDigest(profile.email, matches, dashboardUrl);
      }
    }
  }
}
