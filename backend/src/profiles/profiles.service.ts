import { Injectable, NotFoundException } from "@nestjs/common";
import type { PublicProfile, UpdateProfileInput } from "@signalscout/shared";
import { ProfileRepository } from "./profile.repository";

@Injectable()
export class ProfilesService {
  constructor(private readonly profiles: ProfileRepository) {}

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
}
