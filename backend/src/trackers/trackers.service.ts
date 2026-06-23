import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  PLAN_LIMITS,
  type CreateTrackerInput,
  type Tracker,
  type UpdateTrackerInput,
} from "@signalscout/shared";
import { ProfileRepository } from "../profiles/profile.repository";
import { TrackerRepository } from "./tracker.repository";

@Injectable()
export class TrackersService {
  constructor(
    private readonly trackers: TrackerRepository,
    private readonly profiles: ProfileRepository,
  ) {}

  list(userId: string): Promise<Tracker[]> {
    return this.trackers.listByUser(userId);
  }

  async get(userId: string, id: string): Promise<Tracker> {
    const tracker = await this.trackers.findById(userId, id);
    if (!tracker) {
      throw new NotFoundException({ code: "tracker_not_found", message: "Tracker not found." });
    }
    return tracker;
  }

  async create(userId: string, input: CreateTrackerInput): Promise<Tracker> {
    const profile = await this.profiles.findById(userId);
    if (!profile) {
      throw new NotFoundException({ code: "profile_not_found", message: "Profile not found." });
    }

    const limit = PLAN_LIMITS[profile.planTier].maxTrackers;
    const current = await this.trackers.countByUser(userId);
    if (current >= limit) {
      throw new ForbiddenException({
        code: "tracker_limit_reached",
        message: `Your ${PLAN_LIMITS[profile.planTier].label} plan allows up to ${limit} trackers. Upgrade to add more.`,
      });
    }

    return this.trackers.create(userId, input);
  }

  async update(userId: string, id: string, input: UpdateTrackerInput): Promise<Tracker> {
    const updated = await this.trackers.update(userId, id, input);
    if (!updated) {
      throw new NotFoundException({ code: "tracker_not_found", message: "Tracker not found." });
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.trackers.delete(userId, id);
    if (!deleted) {
      throw new NotFoundException({ code: "tracker_not_found", message: "Tracker not found." });
    }
  }
}
