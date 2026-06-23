import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { SupabaseService } from "../supabase/supabase.service";
import type { AuthenticatedUser } from "./auth.types";
import { IS_PUBLIC_KEY } from "./public.decorator";

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/**
 * Global guard (secure-by-default): every route requires a valid Supabase
 * bearer token unless explicitly marked `@Public()`.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Missing bearer token.",
      });
    }

    const user = await this.supabase.verifyAccessToken(token);
    if (!user) {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Invalid or expired token.",
      });
    }

    request.user = user;
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [scheme, value] = header.split(" ");
    return scheme?.toLowerCase() === "bearer" && value ? value : null;
  }
}
