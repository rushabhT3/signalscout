import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthReport } from '@signalscout/shared';
import { Public } from '../auth/public.decorator';
import { RawResponse } from '../common/decorators/raw-response.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Public()
@Controller({ version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @RawResponse()
  @ApiOperation({ summary: 'Liveness probe' })
  live(): HealthReport {
    return this.health.liveness();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @RawResponse()
  @ApiOperation({ summary: 'Readiness probe (checks downstream dependencies)' })
  ready(): Promise<HealthReport> {
    return this.health.readiness();
  }
}
