import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ZodError, type ZodType } from "zod";

/**
 * Validates and parses request payloads with a shared Zod schema, giving the
 * frontend and backend a single source of truth for both shape and types.
 */
@Injectable()
export class ZodValidationPipe<TOut> implements PipeTransform<unknown, TOut> {
  constructor(private readonly schema: ZodType<TOut>) {}

  transform(value: unknown): TOut {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: "validation_error",
          message: "Request validation failed.",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }
      throw error;
    }
  }
}
