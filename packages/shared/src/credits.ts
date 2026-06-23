import type { PlanTier } from "./plans";

export interface CreditAccount {
  balance: number;
  planTier: PlanTier;
  monthlyAllotment: number;
  resetsAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  amount: number;
  reason: string;
  reference: string | null;
  balanceAfter: number;
  createdAt: string;
}
