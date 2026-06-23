import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createTrackerSchema,
  updateTrackerSchema,
  type CreateTrackerInput,
  type Tracker,
  type UpdateTrackerInput,
} from '@signalscout/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RawResponse } from '../common/decorators/raw-response.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SUPABASE_JWT_SECURITY } from '../common/swagger';
import { TrackersService } from './trackers.service';

@ApiTags('trackers')
@ApiBearerAuth(SUPABASE_JWT_SECURITY)
@Controller({ path: 'trackers', version: '1' })
export class TrackersController {
  constructor(private readonly trackers: TrackersService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's trackers" })
  list(@CurrentUser() user: AuthenticatedUser): Promise<Tracker[]> {
    return this.trackers.list(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tracker by id' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Tracker> {
    return this.trackers.get(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a tracker' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createTrackerSchema)) input: CreateTrackerInput,
  ): Promise<Tracker> {
    return this.trackers.create(user.id, input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tracker' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTrackerSchema)) input: UpdateTrackerInput,
  ): Promise<Tracker> {
    return this.trackers.update(user.id, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RawResponse()
  @ApiOperation({ summary: 'Delete a tracker' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.trackers.remove(user.id, id);
  }
}
