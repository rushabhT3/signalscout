import type { Params } from 'nestjs-pino';
import type { AppConfigService } from '../../config/app-config.service';
import { SERVICE_NAME } from '../constants';

/**
 * Pretty, human-readable logs in development; structured JSON (one line per
 * event, ready for Cloud Logging) in production. Secrets are always redacted.
 */
export function buildLoggerParams(config: AppConfigService): Params {
  return {
    pinoHttp: {
      level: config.logLevel,
      autoLogging: true,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
        remove: true,
      },
      customProps: () => ({ service: SERVICE_NAME }),
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                colorize: true,
                translateTime: 'SYS:standard',
              },
            }
          : undefined,
    },
  };
}
