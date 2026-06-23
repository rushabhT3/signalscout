import { Global, Module } from "@nestjs/common";
import { APP_CONFIG } from "./config.tokens";
import { AppConfigService } from "./app-config.service";
import { validateEnv } from "./env.schema";

@Global()
@Module({
  providers: [
    { provide: APP_CONFIG, useFactory: () => validateEnv(process.env) },
    AppConfigService,
  ],
  exports: [APP_CONFIG, AppConfigService],
})
export class AppConfigModule {}
