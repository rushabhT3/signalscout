import type { ApiResult } from "@signalscout/shared";
import { API_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as ApiResult<T> | null;

  if (!response.ok || !body || !body.ok) {
    const error =
      body && !body.ok
        ? body.error
        : { code: "network_error", message: "Something went wrong. Please try again." };
    throw new ApiError(error.message, error.code, response.status);
  }

  return body.data;
}
