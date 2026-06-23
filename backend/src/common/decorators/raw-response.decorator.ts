import { SetMetadata } from "@nestjs/common";
import { SKIP_TRANSFORM_KEY } from "../constants";

/** Opts a route out of the global success-envelope transform (e.g. webhooks, probes). */
export const RawResponse = (): MethodDecorator => SetMetadata(SKIP_TRANSFORM_KEY, true);
