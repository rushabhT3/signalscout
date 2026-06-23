import { Module } from '@nestjs/common';
import { JOB_BOARD_ADAPTERS } from './job-board.adapter';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter';
import { LeverAdapter } from './adapters/lever.adapter';
import { AshbyAdapter } from './adapters/ashby.adapter';
import { JobBoardRegistry } from './job-board.registry';
import { IngestionService } from './ingestion.service';

@Module({
  providers: [
    GreenhouseAdapter,
    LeverAdapter,
    AshbyAdapter,
    {
      provide: JOB_BOARD_ADAPTERS,
      inject: [GreenhouseAdapter, LeverAdapter, AshbyAdapter],
      useFactory: (
        greenhouse: GreenhouseAdapter,
        lever: LeverAdapter,
        ashby: AshbyAdapter,
      ) => [greenhouse, lever, ashby],
    },
    JobBoardRegistry,
    IngestionService,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
