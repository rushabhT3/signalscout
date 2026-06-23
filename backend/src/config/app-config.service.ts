import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG } from './config.tokens';
import type { Env } from './env.schema';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
}

export interface AiConfig {
  provider: Env['AI_PROVIDER'];
  geminiApiKey: string | undefined;
  geminiModel: string;
}

export interface StripeConfig {
  enabled: boolean;
  secretKey: string | undefined;
  webhookSecret: string | undefined;
  proPriceId: string | undefined;
}

export interface EmailConfig {
  enabled: boolean;
  apiKey: string | undefined;
  from: string | undefined;
}

export interface IngestionConfig {
  enabled: boolean;
  cron: string;
  batchSize: number;
}

/**
 * Typed, grouped accessor over the validated environment. Consumers depend on
 * this abstraction rather than reading `process.env` directly.
 */
@Injectable()
export class AppConfigService {
  constructor(@Inject(APP_CONFIG) private readonly env: Env) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get port(): number {
    return this.env.PORT;
  }

  get logLevel(): Env['LOG_LEVEL'] {
    return this.env.LOG_LEVEL;
  }

  get frontendUrl(): string {
    return this.env.FRONTEND_URL;
  }

  get corsOrigins(): string[] {
    return this.env.CORS_ORIGINS;
  }

  get supabase(): SupabaseConfig {
    return {
      url: this.env.SUPABASE_URL,
      anonKey: this.env.SUPABASE_ANON_KEY,
      serviceRoleKey: this.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: this.env.SUPABASE_JWT_SECRET,
    };
  }

  get ai(): AiConfig {
    return {
      provider: this.env.AI_PROVIDER,
      geminiApiKey: this.env.GEMINI_API_KEY,
      geminiModel: this.env.GEMINI_MODEL,
    };
  }

  get stripe(): StripeConfig {
    return {
      enabled: Boolean(
        this.env.STRIPE_SECRET_KEY && this.env.STRIPE_PRICE_PRO_MONTHLY,
      ),
      secretKey: this.env.STRIPE_SECRET_KEY,
      webhookSecret: this.env.STRIPE_WEBHOOK_SECRET,
      proPriceId: this.env.STRIPE_PRICE_PRO_MONTHLY,
    };
  }

  get email(): EmailConfig {
    return {
      enabled: Boolean(this.env.RESEND_API_KEY && this.env.EMAIL_FROM),
      apiKey: this.env.RESEND_API_KEY,
      from: this.env.EMAIL_FROM,
    };
  }

  get ingestion(): IngestionConfig {
    return {
      enabled: this.env.INGESTION_ENABLED,
      cron: this.env.INGESTION_CRON,
      batchSize: this.env.INGESTION_BATCH_SIZE,
    };
  }

  get internalApiSecret(): string | undefined {
    return this.env.INTERNAL_API_SECRET;
  }
}
