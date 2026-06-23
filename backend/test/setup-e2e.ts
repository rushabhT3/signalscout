/**
 * Seeds a valid-but-fake environment before any application module is imported.
 * `@nestjs/config` validates eagerly at module load, so this must run first
 * (registered via `setupFiles`, which execute before test files are evaluated).
 */
Object.assign(process.env, {
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  SUPABASE_JWT_SECRET: "test-jwt-secret",
  AI_PROVIDER: "mock",
} satisfies Record<string, string>);
