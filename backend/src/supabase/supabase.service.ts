import { Injectable } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppConfigService } from "../config/app-config.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import type { Database } from "./database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;

@Injectable()
export class SupabaseService {
  private readonly serviceClient: TypedSupabaseClient;

  constructor(config: AppConfigService) {
    const { url, serviceRoleKey } = config.supabase;
    this.serviceClient = createClient<Database>(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Service-role client — bypasses RLS. Repositories MUST scope every query by
   * the authenticated user id; RLS remains the defense-in-depth layer.
   */
  get admin(): TypedSupabaseClient {
    return this.serviceClient;
  }

  /** Validates a Supabase access token via GoTrue; returns null when invalid. */
  async verifyAccessToken(token: string): Promise<AuthenticatedUser | null> {
    const { data, error } = await this.serviceClient.auth.getUser(token);
    if (error || !data.user?.email) {
      return null;
    }
    return { id: data.user.id, email: data.user.email };
  }
}
