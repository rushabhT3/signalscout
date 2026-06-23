import { Injectable } from "@nestjs/common";
import type { PlanTier, PublicProfile } from "@signalscout/shared";
import { SupabaseService } from "../supabase/supabase.service";
import type { Database } from "../supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export interface BillingUpdate {
  planTier?: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
}

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

  async getStripeCustomerId(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to read billing customer: ${error.message}`);
    }
    return data.stripe_customer_id;
  }

  async findIdByCustomerId(customerId: string): Promise<string | null> {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find profile by customer: ${error.message}`);
    }
    return data?.id ?? null;
  }

  async updateBilling(userId: string, billing: BillingUpdate): Promise<void> {
    const payload: ProfileUpdate = {};
    if (billing.planTier !== undefined) payload.plan_tier = billing.planTier;
    if (billing.stripeCustomerId !== undefined) payload.stripe_customer_id = billing.stripeCustomerId;
    if (billing.stripeSubscriptionId !== undefined) {
      payload.stripe_subscription_id = billing.stripeSubscriptionId;
    }
    if (billing.subscriptionStatus !== undefined) {
      payload.subscription_status = billing.subscriptionStatus;
    }

    const { error } = await this.supabase.admin.from("profiles").update(payload).eq("id", userId);
    if (error) {
      throw new Error(`Failed to update billing: ${error.message}`);
    }
  }

  /**
   * Atomically claims the one-time welcome: marks welcomed_at only if still null.
   * Returns contact details when this call performed the claim, else null.
   */
  async claimWelcome(userId: string): Promise<{ email: string; fullName: string | null } | null> {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .update({ welcomed_at: new Date().toISOString() })
      .eq("id", userId)
      .is("welcomed_at", null)
      .select("email, full_name")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to claim welcome: ${error.message}`);
    }
    return data ? { email: data.email, fullName: data.full_name } : null;
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
