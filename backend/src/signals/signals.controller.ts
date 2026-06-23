import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  generateOutreachSchema,
  signalListQuerySchema,
  updateSignalSchema,
  type GenerateOutreachInput,
  type SignalListQuery,
  type SignalView,
  type TrackerRunResult,
  type UpdateSignalInput,
} from '@signalscout/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SUPABASE_JWT_SECURITY } from '../common/swagger';
import { SignalsService } from './signals.service';

@ApiTags('signals')
@ApiBearerAuth(SUPABASE_JWT_SECURITY)
@Controller({ version: '1' })
export class SignalsController {
  constructor(private readonly signals: SignalsService) {}

  @Get('signals')
  @ApiOperation({ summary: 'List signals (defaults to matches only)' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(signalListQuerySchema)) query: SignalListQuery,
  ): Promise<SignalView[]> {
    return this.signals.list(user.id, query);
  }

  @Get('signals/:id')
  @ApiOperation({ summary: 'Get a signal by id' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SignalView> {
    return this.signals.get(user.id, id);
  }

  @Patch('signals/:id')
  @ApiOperation({ summary: "Update a signal's pipeline status" })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateSignalSchema)) input: UpdateSignalInput,
  ): Promise<SignalView> {
    return this.signals.updateStatus(user.id, id, input);
  }

  @Post('signals/:id/outreach')
  @ApiOperation({
    summary: 'Generate an AI outreach draft for a matched signal',
  })
  generateOutreach(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(generateOutreachSchema))
    input: GenerateOutreachInput,
  ): Promise<SignalView> {
    return this.signals.generateOutreach(user.id, id, input);
  }

  @Post('trackers/:trackerId/run')
  @ApiOperation({
    summary: 'Run a tracker: ingest postings and evaluate new ones',
  })
  run(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trackerId', ParseUUIDPipe) trackerId: string,
  ): Promise<TrackerRunResult> {
    return this.signals.runTracker(user.id, trackerId);
  }
}
