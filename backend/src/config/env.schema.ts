import { z } from 'zod';

const csvList = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

const booleanFromEnv = z
  .union([
    z.boolean(),
    z
      .enum(['true', 'false', '1', '0'])
      .transform((value) => value === 'true' || value === '1'),
  ])
  .default(false);

/**
 * Single source of truth for runtime configuration. Parsed once at boot so the
 * process fails fast (and loudly) on misconfiguration rather than at first use.
 */
export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(8080),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    FRONTEND_URL: z.url().default('http://localhost:3000'),
    CORS_ORIGINS: csvList.default(['http://localhost:3000']),

    SUPABASE_URL: z.url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_JWT_SECRET: z.string().min(1),

    AI_PROVIDER: z.enum(['gemini', 'mock']).default('mock'),
    GEMINI_API_KEY: z.string().min(1).optional(),
    GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),

    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    STRIPE_PRICE_PRO_MONTHLY: z.string().min(1).optional(),

    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    INTERNAL_API_SECRET: z.string().min(1).optional(),

    INGESTION_ENABLED: booleanFromEnv,
    INGESTION_CRON: z.string().min(1).default('0 */6 * * *'),
    INGESTION_BATCH_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(10),
  })
  .refine(
    (env) => env.AI_PROVIDER !== 'gemini' || Boolean(env.GEMINI_API_KEY),
    {
      message: 'GEMINI_API_KEY is required when AI_PROVIDER=gemini',
      path: ['GEMINI_API_KEY'],
    },
  );

export type Env = z.infer<typeof envSchema>;

export function validateEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map(
        (issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}
