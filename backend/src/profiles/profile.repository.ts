import { Injectable } from "@nestjs/common";
import type { PublicProfile } from "@signalscout/shared";
import { SupabaseService } from "../supabase/supabase.service";
import type { Database } from "../supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

@Injectable()
export class ProfileRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findById(userId: string): Promise<PublicProfile | null> {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load profile: ${error.message}`);
    }
    return data ? this.toPublic(data) : null;
  }

  async updateFullName(userId: string, fullName: string): Promise<PublicProfile> {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
    return this.toPublic(data);
  }

  private toPublic(row: ProfileRow): PublicProfile {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      planTier: row.plan_tier,
      creditsBalance: row.credits_balance,
      creditsResetAt: row.credits_reset_at,
      subscriptionStatus: row.subscription_status,
      createdAt: row.created_at,
    };
  }
}
