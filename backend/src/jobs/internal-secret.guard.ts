import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AppConfigService } from "../config/app-config.service";

/** Protects internal job-trigger endpoints with a shared secret header. */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.internalApiSecret;
    if (!secret) {
      throw new ServiceUnavailableException({
        code: "internal_disabled",
        message: "Internal endpoints are not configured.",
      });
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers["x-internal-secret"];
    if (provided !== secret) {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Invalid internal secret.",
      });
    }
    return true;
  }
}
