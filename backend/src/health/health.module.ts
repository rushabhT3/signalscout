import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService, READINESS_CHECKS, type DependencyCheck } from "./health.service";
import { SupabaseHealthCheck } from "../supabase/supabase.health";

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    SupabaseHealthCheck,
    {
      provide: READINESS_CHECKS,
      inject: [SupabaseHealthCheck],
      useFactory: (supabase: SupabaseHealthCheck): DependencyCheck[] => [supabase],
    },
  ],
})
export class HealthModule {}
