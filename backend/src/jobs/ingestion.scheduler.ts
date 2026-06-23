import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { AppConfigService } from "../config/app-config.service";
import { IngestionRunnerService } from "./ingestion-runner.service";

/**
 * In-process cron for local/always-on deployments. In serverless (Cloud Run,
 * scale-to-zero) prefer Cloud Scheduler hitting the internal trigger endpoint.
 */
@Injectable()
export class IngestionScheduler implements OnModuleInit {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly runner: IngestionRunnerService,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    if (!this.config.ingestion.enabled) {
      this.logger.log("In-process ingestion scheduler disabled (INGESTION_ENABLED=false).");
      return;
    }

    const job = new CronJob(this.config.ingestion.cron, () => {
      void this.runner.runAllActive();
    });
    this.registry.addCronJob("ingestion-sweep", job);
    job.start();
    this.logger.log(`Ingestion scheduler started (cron: ${this.config.ingestion.cron}).`);
  }
}
