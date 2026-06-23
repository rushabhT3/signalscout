import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import type { CreditReason } from "../supabase/database.types";
import { InsufficientCreditsException } from "./insufficient-credits.exception";

@Injectable()
export class CreditsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getBalance(userId: string): Promise<number> {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .select("credits_balance")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to read credit balance: ${error.message}`);
    }
    return data.credits_balance;
  }

  /** Atomically debits credits. Throws {@link InsufficientCreditsException} when short. */
  async debit(
    userId: string,
    amount: number,
    reason: CreditReason,
    reference?: string,
  ): Promise<number> {
    const { data, error } = await this.supabase.admin.rpc("debit_credits", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_reference: reference ?? null,
    });

    if (error) {
      if (error.message.includes("insufficient_credits")) {
        throw new InsufficientCreditsException();
      }
      throw new Error(`Failed to debit credits: ${error.message}`);
    }
    return data;
  }

  async grant(
    userId: string,
    amount: number,
    reason: CreditReason,
    reference?: string,
  ): Promise<number> {
    const { data, error } = await this.supabase.admin.rpc("grant_credits", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_reference: reference ?? null,
    });

    if (error) {
      throw new Error(`Failed to grant credits: ${error.message}`);
    }
    return data;
  }
}
