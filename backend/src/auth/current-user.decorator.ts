import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedUser } from './auth.types';

/** Injects the authenticated user attached by {@link SupabaseAuthGuard}. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new UnauthorizedException({
        code: 'unauthorized',
        message: 'Authentication required.',
      });
    }
    return request.user;
  },
);
