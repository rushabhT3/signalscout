import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  updateProfileSchema,
  type PublicProfile,
  type UpdateProfileInput,
} from "@signalscout/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { SUPABASE_JWT_SECURITY } from "../common/swagger";
import { ProfilesService } from "./profiles.service";

@ApiTags("profile")
@ApiBearerAuth(SUPABASE_JWT_SECURITY)
@Controller({ path: "me", version: "1" })
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
}
