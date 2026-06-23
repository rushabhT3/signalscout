import { Inject, Injectable, Optional } from "@nestjs/common";
import type { HealthReport, HealthState } from "@signalscout/shared";
import { APP_VERSION, SERVICE_NAME } from "../common/constants";

export interface DependencyCheck {
  readonly name: string;
  check(): Promise<boolean>;
}

export const READINESS_CHECKS = Symbol("READINESS_CHECKS");

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();
  private readonly checks: DependencyCheck[];

  constructor(
    @Optional() @Inject(READINESS_CHECKS) checks: DependencyCheck[] | undefined,
  ) {
    this.checks = checks ?? [];
  }

  liveness(): HealthReport {
    return this.report("ok");
  }

  async readiness(): Promise<HealthReport> {
    const results = await Promise.all(
      this.checks.map(async (dependency) => {
        try {
          return await dependency.check();
        } catch {
          return false;
        }
      }),
    );
    const healthy = results.every(Boolean);
    return this.report(healthy ? "ok" : "degraded");
  }

  private report(status: HealthState): HealthReport {
    return {
      status,
      service: SERVICE_NAME,
      version: APP_VERSION,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
