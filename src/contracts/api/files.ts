import type { File } from "../entities/file";
import type { MediaType } from "../enums/media-type";

export interface ListFilesParams {
  clusterId: string;
  cursor?: string;
  limit?: number;
  mediaType?: MediaType;
}

export interface ListFilesResponse {
  files: File[];
  nextCursor: string | null;
}

export interface GetFileResponse {
  file: File;
}

/** Busca por nome, tipo e/ou range de datas (UC-010). */
export interface SearchFilesParams {
  clusterId: string;
  q?: string;
  mediaType?: MediaType;
  from?: string;
  to?: string;
  limit?: number;
}

export interface SearchFilesResponse {
  files: File[];
  count: number;
}

/** Agrupamento cronologico por mes/ano. */
export interface TimelineEntry {
  year: number;
  month: number;
  count: number;
  fotos: number;
  videos: number;
  documentos: number;
}

export interface TimelineResponse {
  timeline: TimelineEntry[];
}

/** Versoes de um arquivo. */
export interface FileVersionEntry {
  id: string;
  version: number;
  parentId: string | null;
  originalName: string;
  originalSize: number;
  optimizedSize: number;
  contentHash: string;
  status: string;
  createdAt: string;
}

export interface FileVersionsResponse {
  versions: FileVersionEntry[];
}

/** Verificacao de dedup por hash. */
export interface CheckHashResponse {
  exists: boolean;
  originalFileId?: string;
  chunksCount?: number;
  optimizedSize?: number;
}

/** Placeholder para download sob demanda (UC-009). */
export interface PlaceholderResponse {
  id: string;
  originalName: string;
  mediaType: string;
  mimeType: string;
  fileExtension: string;
  originalSize: number;
  optimizedSize: number;
  status: string;
  previewChunkId: string | null;
  hasContent: boolean;
  createdAt: string;
}

/** Quota de armazenamento por membro. */
export interface QuotaResponse {
  memberId: string;
  storageQuota: number;
  storageUsed: number;
  storageAvailable: number;
  usagePercent: number;
}

/** Tiering report (hot/warm/cold). */
export interface TieringMigration {
  fileId: string;
  originalName: string;
  currentTier: string;
  suggestedTier: string;
  daysSinceAccess: number;
  optimizedSize: number;
}

export interface TieringResponse {
  hotFiles: number;
  warmFiles: number;
  coldFiles: number;
  migrationsSuggested: TieringMigration[];
}

/** Rebalancing report. */
export interface RebalanceResponse {
  nodesInRing: number;
  chunksAnalyzed: number;
  correctlyPlaced: number;
  needMigration: number;
  migrationsExecuted: number;
}

/** Cluster health dashboard. */
export interface ClusterHealthDetail {
  clusterId: string;
  files: { total: number; ready: number; processing: number; error: number };
  storage: { totalBytes: number; usedBytes: number; availableBytes: number; usagePercent: number };
  nodes: { total: number; online: number; suspect: number; lost: number };
  replication: { totalChunks: number; totalReplicas: number; avgReplicasPerChunk: number; underReplicated: number; healthPercent: number };
  alerts: { active: number; critical: number; warning: number; info: number };
}

/** Recovery report. */
export interface RecoveryResponse {
  seedValid: boolean;
  masterKeyDerived: boolean;
  vaultsRecovered: number;
  manifestsFound: number;
  filesRecovered: number;
  chunksMissing: number;
  nodesReconnected: number;
  status: "Complete" | "Partial" | "Failed";
}
