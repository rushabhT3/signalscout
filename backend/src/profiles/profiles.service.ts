import { Injectable, NotFoundException } from "@nestjs/common";
import type { PublicProfile, UpdateProfileInput } from "@signalscout/shared";
import { AppConfigService } from "../config/app-config.service";
import { EmailService } from "../email/email.service";
import { ProfileRepository } from "./profile.repository";

@Injectable()
export class ProfilesService {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly email: EmailService,
    private readonly config: AppConfigService,
  ) {}

  async getProfile(userId: string): Promise<PublicProfile> {
    const profile = await this.profiles.findById(userId);
    if (!profile) {
      throw new NotFoundException({
        code: "profile_not_found",
        message: "Profile not found.",
      });
    }
    return profile;
  }

  updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicProfile> {
    return this.profiles.updateFullName(userId, input.fullName);
  }

  /** Sends the welcome email exactly once per user (idempotent). */
  async claimWelcome(userId: string): Promise<void> {
    const claimed = await this.profiles.claimWelcome(userId);
    if (claimed) {
      await this.email.sendWelcome(
        claimed.email,
        claimed.fullName,
        `${this.config.frontendUrl}/dashboard`,
      );
    }
  }
}
