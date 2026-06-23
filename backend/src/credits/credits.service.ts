import { Injectable } from '@nestjs/common';
import {
  PLAN_LIMITS,
  type CreditAccount,
  type CreditLedgerEntry,
} from '@signalscout/shared';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreditReason } from '../supabase/database.types';
import { InsufficientCreditsException } from './insufficient-credits.exception';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class CreditsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getBalance(userId: string): Promise<number> {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to read credit balance: ${error.message}`);
    }
    return data.credits_balance;
  }

  /** Returns the credit account, lazily applying the monthly reset when due. */
  async getAccount(userId: string): Promise<CreditAccount> {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .select('plan_tier, credits_balance, credits_reset_at')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to read credit account: ${error.message}`);
    }

    const monthlyAllotment = PLAN_LIMITS[data.plan_tier].monthlyCredits;
    let balance = data.credits_balance;
    let lastReset = data.credits_reset_at;

    if (new Date(lastReset).getTime() <= Date.now() - THIRTY_DAYS_MS) {
      const { data: resetBalance, error: resetError } =
        await this.supabase.admin.rpc('reset_credits_if_due', {
          p_user_id: userId,
          p_amount: monthlyAllotment,
        });
      if (resetError) {
        throw new Error(`Failed to reset credits: ${resetError.message}`);
      }
      balance = resetBalance;
      lastReset = new Date().toISOString();
    }

    return {
      balance,
      planTier: data.plan_tier,
      monthlyAllotment,
      resetsAt: new Date(
        new Date(lastReset).getTime() + THIRTY_DAYS_MS,
      ).toISOString(),
    };
  }

  async listLedger(userId: string, limit = 20): Promise<CreditLedgerEntry[]> {
    const { data, error } = await this.supabase.admin
      .from('credit_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to read credit ledger: ${error.message}`);
    }

    return data.map((row) => ({
      id: row.id,
      amount: row.amount,
      reason: row.reason,
      reference: row.reference,
      balanceAfter: row.balance_after,
      createdAt: row.created_at,
    }));
  }

  /** Atomically debits credits. Throws {@link InsufficientCreditsException} when short. */
  async debit(
    userId: string,
    amount: number,
    reason: CreditReason,
    reference?: string,
  ): Promise<number> {
    const { data, error } = await this.supabase.admin.rpc('debit_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_reference: reference ?? null,
    });

    if (error) {
      if (error.message.includes('insufficient_credits')) {
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
    const { data, error } = await this.supabase.admin.rpc('grant_credits', {
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
