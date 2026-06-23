import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, Observable } from "rxjs";
import type { ApiSuccess } from "@signalscout/shared";
import { SKIP_TRANSFORM_KEY } from "../constants";

/**
 * Wraps every successful controller result in the shared `{ ok: true, data }`
 * envelope so the frontend has one predictable response contract. Routes
 * decorated with `@RawResponse()` are passed through untouched.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccess<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(map((data): ApiSuccess<T> => ({ ok: true, data })));
  }
}
