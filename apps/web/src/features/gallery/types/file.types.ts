/**
 * Tipos de dados da galeria — derivados de src/contracts/api/files.ts
 * Fonte: docs/frontend/shared/06-data-layer.md (DTOs Principais)
 */

export type MediaType = 'photo' | 'video' | 'document' | 'archive';
export type FileStatus = 'processing' | 'ready' | 'error' | 'corrupted';
export type GalleryView = 'grid' | 'timeline';

export interface FileDTO {
  id: string;
  name: string;
  mimeType: string;
  mediaType: MediaType;
  originalSize: number;
  optimizedSize: number | null;
  status: FileStatus;
  previewUrl: string;
  metadata: FileMetadata | null;
  createdAt: string;
}

export interface FileDetailDTO extends FileDTO {
  hash: string;
  chunksCount: number;
  replicationFactor: number;
  codingScheme?: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

export interface FileMetadata {
  width?: number;
  height?: number;
  takenAt?: string;
  camera?: string;
  gps?: { lat: number; lng: number };
  duration?: number;
  codec?: string;
  pages?: number;
}

export interface FilesResponse {
  data: FileDTO[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
  };
}

export interface FileVersionDTO {
  id: string;
  versionNumber: number;
  versionOf: string | null;
  originalName: string;
  status: FileStatus;
  originalSize: number;
  createdAt: string;
}

export interface FileFilters {
  q?: string;
  mediaType?: MediaType;
  cursor?: string;
  from?: string;
  to?: string;
}
