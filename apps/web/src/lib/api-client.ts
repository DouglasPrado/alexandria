/**
 * API Client — camada de comunicacao com o orquestrador.
 * Fonte: docs/frontend/shared/06-data-layer.md (Implementacao Web)
 *
 * - Base URL: /api (proxy via Next.js) ou NEXT_PUBLIC_API_URL
 * - Timeout: 30s (uploads: 5min)
 * - Retry: 3 tentativas, backoff exponencial (1s, 2s, 4s), apenas GET + 5xx
 * - Auth: cookie httpOnly (credentials: include)
 * - Erros tipados: ApiError com status, code e message
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  uploadTimeout: number;
  retries: number;
}

const config: ApiClientConfig = {
  baseUrl: BASE_URL,
  timeout: 30_000,
  uploadTimeout: 5 * 60_000,
  retries: 3,
};

/**
 * Erro tipado da API — mapeia HTTP status para erros do dominio.
 * Fonte: docs/frontend/shared/06-data-layer.md (Erros Tipados)
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: { code: string; message: string; details?: unknown },
  ) {
    super(body.message);
    this.name = 'ApiError';
  }
}

/**
 * Request com timeout via AbortController e retry para GET + 5xx.
 */
async function request<T>(
  path: string,
  options?: RequestInit & { timeout?: number; params?: Record<string, string> },
): Promise<T> {
  const { timeout: customTimeout, params, ...init } = options ?? {};

  let url = `${config.baseUrl}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) searchParams.set(key, value);
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const isIdempotent = !init.method || init.method === 'GET' || init.method === 'DELETE';
  let lastError: unknown;

  for (let attempt = 0; attempt <= (isIdempotent ? config.retries : 0); attempt++) {
    if (attempt > 0) {
      // Backoff exponencial: 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      customTimeout ?? config.timeout,
    );

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': crypto.randomUUID(),
          ...init.headers,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({
          code: 'UNKNOWN',
          message: res.statusText,
        }));
        const error = new ApiError(res.status, body);

        // Retry apenas para 5xx em metodos idempotentes
        if (res.status >= 500 && isIdempotent && attempt < config.retries) {
          lastError = error;
          continue;
        }

        throw error;
      }

      if (res.status === 204) return undefined as T;
      return res.json();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      lastError = err;

      // Retry em falhas de rede para metodos idempotentes
      if (isIdempotent && attempt < config.retries) continue;
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

/**
 * API client tipado — exporta metodos por verbo HTTP.
 * Fonte: docs/frontend/shared/06-data-layer.md
 */
export const apiClient = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  /**
   * Upload multipart — timeout de 5 minutos.
   * Nao envia Content-Type (browser seta automaticamente com boundary).
   */
  upload: async <T>(path: string, file: File): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.uploadTimeout);

    try {
      const res = await fetch(`${config.baseUrl}${path}`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        body: formData,
        headers: {
          'X-Correlation-Id': crypto.randomUUID(),
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({
          code: 'UNKNOWN',
          message: res.statusText,
        }));
        throw new ApiError(res.status, body);
      }

      return res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
