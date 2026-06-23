/**
 * Hand-authored database types mirroring supabase/migrations. In production these
 * would be generated with `supabase gen types typescript`; kept manual here so the
 * repo type-checks without a live project. Keep in sync with the SQL migration.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PlanTier = "free" | "pro";

export type SignalCategory =
  | "hiring_surge"
  | "first_role_of_type"
  | "leadership_hire"
  | "team_expansion"
  | "tech_adoption"
  | "geographic_expansion"
  | "not_a_match";

export type LeadStatus = "new" | "saved" | "contacted" | "archived";

export type JobBoardProvider = "greenhouse" | "lever" | "ashby";

export type CreditReason =
  | "signal_evaluation"
  | "outreach_draft"
  | "monthly_grant"
  | "plan_upgrade"
  | "signup_bonus"
  | "manual_adjustment";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          plan_tier: PlanTier;
          credits_balance: number;
          credits_reset_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          plan_tier?: PlanTier;
          credits_balance?: number;
          credits_reset_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          plan_tier?: PlanTier;
          credits_balance?: number;
          credits_reset_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
        };
        Relationships: [];
      };
      trackers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          product_description: string;
          signal_hypothesis: string;
          keywords: string[];
          locations: string[];
          sources: Json;
          is_active: boolean;
          last_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          product_description: string;
          signal_hypothesis: string;
          keywords?: string[];
          locations?: string[];
          sources?: Json;
          is_active?: boolean;
          last_run_at?: string | null;
        };
        Update: {
          name?: string;
          product_description?: string;
          signal_hypothesis?: string;
          keywords?: string[];
          locations?: string[];
          sources?: Json;
          is_active?: boolean;
          last_run_at?: string | null;
        };
        Relationships: [];
      };
      job_postings: {
        Row: {
          id: string;
          provider: JobBoardProvider;
          external_id: string;
          company: string;
          company_slug: string;
          title: string;
          location: string | null;
          description: string;
          url: string;
          posted_at: string | null;
          content_hash: string;
          first_seen_at: string;
        };
        Insert: {
          id?: string;
          provider: JobBoardProvider;
          external_id: string;
          company: string;
          company_slug: string;
          title: string;
          location?: string | null;
          description: string;
          url: string;
          posted_at?: string | null;
          content_hash: string;
        };
        Update: {
          company?: string;
          title?: string;
          location?: string | null;
          description?: string;
          url?: string;
          posted_at?: string | null;
          content_hash?: string;
        };
        Relationships: [];
      };
      signals: {
        Row: {
          id: string;
          user_id: string;
          tracker_id: string;
          job_posting_id: string;
          company: string;
          title: string;
          location: string | null;
          url: string;
          posted_at: string | null;
          is_match: boolean;
          confidence: number;
          category: SignalCategory;
          reasoning: string;
          likely_need: string;
          suggested_angle: string;
          model: string;
          status: LeadStatus;
          outreach: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tracker_id: string;
          job_posting_id: string;
          company: string;
          title: string;
          location?: string | null;
          url: string;
          posted_at?: string | null;
          is_match: boolean;
          confidence: number;
          category: SignalCategory;
          reasoning: string;
          likely_need: string;
          suggested_angle: string;
          model?: string;
          status?: LeadStatus;
          outreach?: Json | null;
        };
        Update: {
          status?: LeadStatus;
          outreach?: Json | null;
        };
        Relationships: [];
      };
      credit_ledger: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: CreditReason;
          reference: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          reason: CreditReason;
          reference?: string | null;
          balance_after: number;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      debit_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_reason: CreditReason;
          p_reference?: string | null;
        };
        Returns: number;
      };
      grant_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_reason: CreditReason;
          p_reference?: string | null;
        };
        Returns: number;
      };
      reset_credits_if_due: {
        Args: { p_user_id: string; p_amount: number };
        Returns: number;
      };
    };
    Enums: {
      plan_tier: PlanTier;
      signal_category: SignalCategory;
      lead_status: LeadStatus;
      job_board_provider: JobBoardProvider;
      credit_reason: CreditReason;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
