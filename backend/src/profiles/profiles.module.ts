import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";
import { ProfileRepository } from "./profile.repository";

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfileRepository],
  exports: [ProfileRepository],
})
export class ProfilesModule {}
