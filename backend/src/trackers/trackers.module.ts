import { Module } from "@nestjs/common";
import { ProfilesModule } from "../profiles/profiles.module";
import { TrackersController } from "./trackers.controller";
import { TrackersService } from "./trackers.service";
import { TrackerRepository } from "./tracker.repository";

@Module({
  imports: [ProfilesModule],
  controllers: [TrackersController],
  providers: [TrackersService, TrackerRepository],
  exports: [TrackerRepository],
})
export class TrackersModule {}
