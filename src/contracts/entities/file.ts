import type { FileStatus } from '../enums/file-status';
import type { MediaType } from '../enums/media-type';

/**
 * File — Arquivo de midia ou documento enviado ao cluster.
 * Classificacao automatica via MIME type (RN-F1).
 * Fotos → WebP 1920px; Videos → 1080p H.265 (RN-F2).
 * Documentos bypass pipeline de otimizacao (RN-F3).
 * Limites: fotos 50MB, videos 10GB, docs 2GB, archives 5GB (RN-F4).
 */
export interface File {
  id: string;
  clusterId: string;
  uploadedBy: string;
  originalName: string;
  mediaType: MediaType;
  mimeType: string;
  originalSize: bigint;
  optimizedSize: bigint | null;
  contentHash: string | null;
  metadata: Record<string, unknown> | null;
  status: FileStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
