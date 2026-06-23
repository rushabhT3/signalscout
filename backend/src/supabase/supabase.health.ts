import { Injectable } from '@nestjs/common';
import type { DependencyCheck } from '../health/health.service';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseHealthCheck implements DependencyCheck {
  readonly name = 'supabase';

  constructor(private readonly supabase: SupabaseService) {}

  async check(): Promise<boolean> {
    const { error } = await this.supabase.admin
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    return !error;
  }
}
