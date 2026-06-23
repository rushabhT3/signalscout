import { Module } from "@nestjs/common";
import { SignalsModule } from "../signals/signals.module";
import { TrackersModule } from "../trackers/trackers.module";
import { IngestionRunnerService } from "./ingestion-runner.service";
import { IngestionScheduler } from "./ingestion.scheduler";
import { InternalSecretGuard } from "./internal-secret.guard";
import { JobsController } from "./jobs.controller";

@Module({
  imports: [SignalsModule, TrackersModule],
  controllers: [JobsController],
  providers: [IngestionRunnerService, IngestionScheduler, InternalSecretGuard],
})
export class JobsModule {}
