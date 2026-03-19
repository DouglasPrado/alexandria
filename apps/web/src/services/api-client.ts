import { ApiError } from "@/types/api.types";
import { useAuthStore } from "@/store/auth-store";

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

  // Read token from auth store (works outside React components)
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-Id": crypto.randomUUID(),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(fullPath, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // Handle 401 with token refresh (only when a token was present to avoid loops)
    if (res.status === 401 && accessToken) {
      const { refreshToken, updateTokens, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (refreshResponse.ok) {
            const tokens = await refreshResponse.json();
            updateTokens(tokens);
            // Retry original request with the new access token
            headers["Authorization"] = `Bearer ${tokens.access_token}`;
            const retryRes = await fetch(fullPath, {
              method,
              headers,
              body: body ? JSON.stringify(body) : undefined,
              signal: controller.signal,
            });
            if (!retryRes.ok) {
              const errorBody = await retryRes.json().catch(() => ({ error: retryRes.statusText }));
              throw new ApiError(
                retryRes.status,
                errorBody.error ?? `API error: ${retryRes.status}`,
                errorBody.code,
              );
            }
            if (retryRes.status === 204) return undefined as T;
            return retryRes.json();
          } else {
            logout();
            if (typeof window !== "undefined") window.location.href = "/login";
          }
        } catch (err) {
          // Re-throw ApiErrors from retry; for network errors fall through to logout
          if (err instanceof ApiError) throw err;
          logout();
          if (typeof window !== "undefined") window.location.href = "/login";
        }
      }
    }

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

async function postMultipart<T>(path: string, formData: FormData): Promise<T> {
  const fullPath = `${API_BASE}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  const { accessToken } = useAuthStore.getState();

  // Do NOT set Content-Type — browser sets it automatically with the correct boundary
  const headers: Record<string, string> = {
    "X-Request-Id": crypto.randomUUID(),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(fullPath, {
      method: "POST",
      headers,
      body: formData,
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

  postMultipart: <T>(path: string, formData: FormData) =>
    postMultipart<T>(path, formData),
};
