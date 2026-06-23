import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CreditsModule } from '../credits/credits.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { TrackersModule } from '../trackers/trackers.module';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { SignalRepository } from './signal.repository';

@Module({
  imports: [AiModule, CreditsModule, IngestionModule, TrackersModule],
  controllers: [SignalsController],
  providers: [SignalsService, SignalRepository],
  exports: [SignalsService],
})
export class SignalsModule {}
