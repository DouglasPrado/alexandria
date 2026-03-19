import { ApiError } from "@/types/api.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const DEFAULT_TIMEOUT = 30_000;

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  // Build URL without window.location.origin (SSR-safe)
  let fullPath = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) fullPath += `?${qs}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(fullPath, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": crypto.randomUUID(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(
        res.status,
        errorBody.error ?? `API error: ${res.status}`,
        errorBody.code,
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>("GET", path, undefined, params),

  post: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, body),

  put: <T>(path: string, body?: unknown) =>
    request<T>("PUT", path, body),

  delete: <T>(path: string) =>
    request<T>("DELETE", path),
};
