import { Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { AI_EVALUATOR } from './ai-evaluator';
import { GeminiEvaluator } from './gemini-evaluator';
import { MockEvaluator } from './mock-evaluator';

@Module({
  providers: [
    {
      provide: AI_EVALUATOR,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        config.ai.provider === 'gemini'
          ? new GeminiEvaluator(config.ai)
          : new MockEvaluator(),
    },
  ],
  exports: [AI_EVALUATOR],
})
export class AiModule {}
