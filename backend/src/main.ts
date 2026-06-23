import { VersioningType } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { setupSwagger } from "./common/swagger";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(AppConfigService);
  const reflector = app.get(Reflector);

  app.use(helmet({ contentSecurityPolicy: config.isProduction ? undefined : false }));
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.setGlobalPrefix("api", { exclude: ["health", "ready"] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.enableShutdownHooks();

  if (!config.isProduction) {
    setupSwagger(app);
  }

  await app.listen(config.port, "0.0.0.0");
  logger.log(`SignalScout API ready on port ${config.port}`, "Bootstrap");
}

void bootstrap();
