/**
 * Alexandria API client — tipado contra os endpoints do orchestrator.
 * Base URL configuravel via env var NEXT_PUBLIC_API_URL.
 */

// Em producao (Docker): vazio — requests vao para o mesmo host (Caddy faz proxy /api/*)
// Em dev local: http://localhost:8080
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Types ────────────────────────────────────────────

export interface FileItem {
  id: string;
  cluster_id: string;
  original_name: string;
  media_type: string;
  mime_type: string;
  file_extension: string;
  original_size: number;
  optimized_size: number;
  status: string;
  created_at: string;
}

export interface GalleryResponse {
  files: FileItem[];
  next_cursor: string | null;
}

export interface NodeItem {
  id: string;
  cluster_id: string;
  name: string;
  node_type: string;
  status: string;
  total_capacity: number;
  used_capacity: number;
  last_heartbeat: string;
}

export interface AlertItem {
  id: string;
  cluster_id: string;
  alert_type: string;
  message: string;
  severity: string;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string;
}

export interface RecoveryReport {
  seed_valid: boolean;
  master_key_derived: boolean;
  vaults_recovered: number;
  manifests_found: number;
  files_recovered: number;
  chunks_missing: number;
  nodes_reconnected: number;
  status: string;
}

export interface UploadResponse {
  file_id: string;
  status: string;
}

// ─── API Functions ────────────────────────────────────

export interface ClusterItem {
  id: string;
  cluster_id: string;
  name: string;
  created_at: string;
}

export const api = {
  // Clusters
  listClusters: () => request<ClusterItem[]>("/api/v1/clusters"),

  createCluster: (data: {
    name: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
  }) =>
    request<{ cluster_id: string; crypto_cluster_id: string; seed_phrase: string[] }>(
      "/api/v1/clusters",
      { method: "POST", body: JSON.stringify(data) }
    ),

  // Files
  listFiles: (clusterId: string, cursor?: string, limit = 20) =>
    request<GalleryResponse>(
      `/api/v1/clusters/${clusterId}/files?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`
    ),

  searchFiles: (
    clusterId: string,
    params: { q?: string; media_type?: string; from?: string; to?: string; limit?: number }
  ) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.media_type) qs.set("media_type", params.media_type);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.limit) qs.set("limit", String(params.limit));
    return request<{ files: FileItem[]; count: number }>(
      `/api/v1/clusters/${clusterId}/files/search?${qs.toString()}`
    );
  },

  uploadFile: (data: {
    cluster_id: string;
    uploaded_by: string;
    original_name: string;
    media_type: string;
    mime_type: string;
    file_extension: string;
    original_size: number;
  }) =>
    request<UploadResponse>("/api/v1/files/upload", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Nodes
  listNodes: (clusterId: string) =>
    request<NodeItem[]>(`/api/v1/clusters/${clusterId}/nodes`),

  // Alerts
  listAlerts: (clusterId: string) =>
    request<AlertItem[]>(`/api/v1/clusters/${clusterId}/alerts`),

  // Health
  health: () => request<{ status: string }>("/api/v1/health"),

  // Recovery
  startRecovery: (seedPhrase: string) =>
    request<RecoveryReport>("/api/v1/recovery", {
      method: "POST",
      body: JSON.stringify({ seed_phrase: seedPhrase }),
    }),
};
