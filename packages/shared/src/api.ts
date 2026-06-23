export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: ApiError };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export const ok = <T>(data: T): ApiSuccess<T> => ({ ok: true, data });
export const fail = (error: ApiError): ApiFailure => ({ ok: false, error });

export type HealthState = "ok" | "degraded" | "down";

export interface HealthReport {
  status: HealthState;
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}
