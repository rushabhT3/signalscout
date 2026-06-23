import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import type { Request, Response } from 'express';
import type { ApiError, ApiFailure } from '@signalscout/shared';

const STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'bad_request',
  [HttpStatus.UNAUTHORIZED]: 'unauthorized',
  [HttpStatus.FORBIDDEN]: 'forbidden',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.CONFLICT]: 'conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable_entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'rate_limited',
  [HttpStatus.PAYMENT_REQUIRED]: 'payment_required',
};

/**
 * Converts any thrown value into the shared `{ ok: false, error }` envelope.
 * 5xx errors are logged with full context; their messages are never leaked.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, error } = this.normalize(exception);

    if (status >= 500) {
      this.logger.error(
        { err: exception, method: request.method, path: request.url },
        'Unhandled server error',
      );
    } else {
      this.logger.warn(
        { code: error.code, method: request.method, path: request.url },
        error.message,
      );
    }

    const body: ApiFailure = { ok: false, error };
    response.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; error: ApiError } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      return {
        status,
        error: this.toError(status, payload, exception.message),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: {
        code: 'internal_error',
        message: 'An unexpected error occurred.',
      },
    };
  }

  private toError(
    status: number,
    payload: unknown,
    fallbackMessage: string,
  ): ApiError {
    const code = STATUS_CODES[status] ?? 'error';

    if (typeof payload === 'string') {
      return { code, message: payload };
    }

    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const message =
        typeof record.message === 'string'
          ? record.message
          : Array.isArray(record.message)
            ? record.message.join(', ')
            : fallbackMessage;
      return {
        code: typeof record.code === 'string' ? record.code : code,
        message,
        ...(record.details !== undefined ? { details: record.details } : {}),
      };
    }

    return { code, message: fallbackMessage };
  }
}
