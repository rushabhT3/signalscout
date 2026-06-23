import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { RawResponse } from '../common/decorators/raw-response.decorator';
import {
  IngestionRunnerService,
  type IngestionSweepSummary,
} from './ingestion-runner.service';
import { InternalSecretGuard } from './internal-secret.guard';

@ApiExcludeController()
@Public()
@UseGuards(InternalSecretGuard)
@Controller({ path: 'internal/jobs', version: VERSION_NEUTRAL })
export class JobsController {
  constructor(private readonly runner: IngestionRunnerService) {}

  @Post('run-ingestion')
  @HttpCode(HttpStatus.OK)
  @RawResponse()
  runIngestion(): Promise<IngestionSweepSummary> {
    return this.runner.runAllActive();
  }
}
