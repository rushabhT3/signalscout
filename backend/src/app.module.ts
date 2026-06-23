import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { LoggerModule } from "nestjs-pino";
import { AppConfigModule } from "./config/app-config.module";
import { AppConfigService } from "./config/app-config.service";
import { validateEnv } from "./config/env.schema";
import { buildLoggerParams } from "./common/logger/pino.config";
import { SupabaseModule } from "./supabase/supabase.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { TrackersModule } from "./trackers/trackers.module";
import { SignalsModule } from "./signals/signals.module";
import { CreditsModule } from "./credits/credits.module";
import { JobsModule } from "./jobs/jobs.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
      validate: validateEnv,
    }),
    AppConfigModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => buildLoggerParams(config),
    }),
    SupabaseModule,
    AuthModule,
    HealthModule,
    ProfilesModule,
    ScheduleModule.forRoot(),
    TrackersModule,
    SignalsModule,
    CreditsModule,
    JobsModule,
  ],
})
export class AppModule {}
