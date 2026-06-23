import { Injectable } from '@nestjs/common';
import type {
  LeadStatus,
  OutreachDraft,
  SignalEvaluation,
  SignalListQuery,
  SignalView,
} from '@signalscout/shared';
import { SupabaseService } from '../supabase/supabase.service';
import type { Database } from '../supabase/database.types';

type SignalRow = Database['public']['Tables']['signals']['Row'];
type SignalInsert = Database['public']['Tables']['signals']['Insert'];

export interface CreateSignalParams {
  userId: string;
  trackerId: string;
  jobPostingId: string;
  company: string;
  title: string;
  location: string | null;
  url: string;
  postedAt: string | null;
  evaluation: SignalEvaluation;
  model: string;
}

@Injectable()
export class SignalRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async listByUser(
    userId: string,
    query: SignalListQuery,
  ): Promise<SignalView[]> {
    let builder = this.supabase.admin
      .from('signals')
      .select('*')
      .eq('user_id', userId)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    if (query.matchesOnly) {
      builder = builder.eq('is_match', true);
    }
    if (query.trackerId) {
      builder = builder.eq('tracker_id', query.trackerId);
    }
    if (query.status) {
      builder = builder.eq('status', query.status);
    }

    const { data, error } = await builder;
    if (error) {
      throw new Error(`Failed to list signals: ${error.message}`);
    }
    return data.map((row) => this.toView(row));
  }

  async findById(userId: string, id: string): Promise<SignalView | null> {
    const { data, error } = await this.supabase.admin
      .from('signals')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load signal: ${error.message}`);
    }
    return data ? this.toView(data) : null;
  }

  async findEvaluatedPostingIds(trackerId: string): Promise<Set<string>> {
    const { data, error } = await this.supabase.admin
      .from('signals')
      .select('job_posting_id')
      .eq('tracker_id', trackerId);

    if (error) {
      throw new Error(`Failed to load evaluated postings: ${error.message}`);
    }
    return new Set(data.map((row) => row.job_posting_id));
  }

  async create(params: CreateSignalParams): Promise<SignalView> {
    const payload: SignalInsert = {
      user_id: params.userId,
      tracker_id: params.trackerId,
      job_posting_id: params.jobPostingId,
      company: params.company,
      title: params.title,
      location: params.location,
      url: params.url,
      posted_at: params.postedAt,
      is_match: params.evaluation.isMatch,
      confidence: params.evaluation.confidence,
      category: params.evaluation.category,
      reasoning: params.evaluation.reasoning,
      likely_need: params.evaluation.likelyNeed,
      suggested_angle: params.evaluation.suggestedAngle,
      model: params.model,
    };

    const { data, error } = await this.supabase.admin
      .from('signals')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create signal: ${error.message}`);
    }
    return this.toView(data);
  }

  async updateStatus(
    userId: string,
    id: string,
    status: LeadStatus,
  ): Promise<SignalView | null> {
    const { data, error } = await this.supabase.admin
      .from('signals')
      .update({ status })
      .eq('user_id', userId)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update signal status: ${error.message}`);
    }
    return data ? this.toView(data) : null;
  }

  async attachOutreach(
    userId: string,
    id: string,
    outreach: OutreachDraft,
  ): Promise<SignalView | null> {
    const { data, error } = await this.supabase.admin
      .from('signals')
      .update({ outreach: outreach })
      .eq('user_id', userId)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to attach outreach: ${error.message}`);
    }
    return data ? this.toView(data) : null;
  }

  private toView(row: SignalRow): SignalView {
    return {
      id: row.id,
      trackerId: row.tracker_id,
      company: row.company,
      title: row.title,
      location: row.location,
      url: row.url,
      postedAt: row.posted_at,
      isMatch: row.is_match,
      confidence: row.confidence,
      category: row.category,
      reasoning: row.reasoning,
      likelyNeed: row.likely_need,
      suggestedAngle: row.suggested_angle,
      status: row.status,
      outreach: (row.outreach as unknown as OutreachDraft | null) ?? null,
      createdAt: row.created_at,
    };
  }
}
