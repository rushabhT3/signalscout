import { Injectable } from "@nestjs/common";
import type {
  CreateTrackerInput,
  Tracker,
  TrackerSource,
  UpdateTrackerInput,
} from "@signalscout/shared";
import { SupabaseService } from "../supabase/supabase.service";
import type { Database, Json } from "../supabase/database.types";

type TrackerRow = Database["public"]["Tables"]["trackers"]["Row"];
type TrackerInsert = Database["public"]["Tables"]["trackers"]["Insert"];
type TrackerUpdate = Database["public"]["Tables"]["trackers"]["Update"];

@Injectable()
export class TrackerRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async listByUser(userId: string): Promise<Tracker[]> {
    const { data, error } = await this.supabase.admin
      .from("trackers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list trackers: ${error.message}`);
    }
    return data.map((row) => this.toDomain(row));
  }

  async listActive(): Promise<Array<Tracker & { userId: string }>> {
    const { data, error } = await this.supabase.admin
      .from("trackers")
      .select("*")
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to list active trackers: ${error.message}`);
    }
    return data.map((row) => ({ ...this.toDomain(row), userId: row.user_id }));
  }

  async countByUser(userId: string): Promise<number> {
    const { count, error } = await this.supabase.admin
      .from("trackers")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to count trackers: ${error.message}`);
    }
    return count ?? 0;
  }

  async findById(userId: string, id: string): Promise<Tracker | null> {
    const { data, error } = await this.supabase.admin
      .from("trackers")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load tracker: ${error.message}`);
    }
    return data ? this.toDomain(data) : null;
  }

  async create(userId: string, input: CreateTrackerInput): Promise<Tracker> {
    const payload: TrackerInsert = {
      user_id: userId,
      name: input.name,
      product_description: input.productDescription,
      signal_hypothesis: input.signalHypothesis,
      keywords: input.keywords,
      locations: input.locations,
      sources: input.sources as unknown as Json,
    };

    const { data, error } = await this.supabase.admin
      .from("trackers")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create tracker: ${error.message}`);
    }
    return this.toDomain(data);
  }

  async update(userId: string, id: string, input: UpdateTrackerInput): Promise<Tracker | null> {
    const payload: TrackerUpdate = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.productDescription !== undefined) payload.product_description = input.productDescription;
    if (input.signalHypothesis !== undefined) payload.signal_hypothesis = input.signalHypothesis;
    if (input.keywords !== undefined) payload.keywords = input.keywords;
    if (input.locations !== undefined) payload.locations = input.locations;
    if (input.sources !== undefined) payload.sources = input.sources as unknown as Json;
    if (input.isActive !== undefined) payload.is_active = input.isActive;

    const { data, error } = await this.supabase.admin
      .from("trackers")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update tracker: ${error.message}`);
    }
    return data ? this.toDomain(data) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const { error, count } = await this.supabase.admin
      .from("trackers")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete tracker: ${error.message}`);
    }
    return (count ?? 0) > 0;
  }

  async markRun(id: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from("trackers")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update tracker run time: ${error.message}`);
    }
  }

  private toDomain(row: TrackerRow): Tracker {
    return {
      id: row.id,
      name: row.name,
      productDescription: row.product_description,
      signalHypothesis: row.signal_hypothesis,
      keywords: row.keywords,
      locations: row.locations,
      // jsonb boundary: validated by Zod at the API layer before it lands here.
      sources: (row.sources as unknown as TrackerSource[]) ?? [],
      isActive: row.is_active,
      lastRunAt: row.last_run_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
