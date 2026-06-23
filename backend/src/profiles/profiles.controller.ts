import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  updateProfileSchema,
  type PublicProfile,
  type UpdateProfileInput,
} from '@signalscout/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RawResponse } from '../common/decorators/raw-response.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SUPABASE_JWT_SECURITY } from '../common/swagger';
import { ProfilesService } from './profiles.service';

@ApiTags('profile')
@ApiBearerAuth(SUPABASE_JWT_SECURITY)
@Controller({ path: 'me', version: '1' })
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's profile" })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<PublicProfile> {
    return this.profiles.getProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: "Update the current user's profile" })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) input: UpdateProfileInput,
  ): Promise<PublicProfile> {
    return this.profiles.updateProfile(user.id, input);
  }

  @Post('welcome')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RawResponse()
  @ApiOperation({ summary: 'Send the one-time welcome email (idempotent)' })
  claimWelcome(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.profiles.claimWelcome(user.id);
  }
}
