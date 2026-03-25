import type { FileStatus } from '../enums/file-status';
import type { MediaType } from '../enums/media-type';

/** GET /api/files — query params */
export interface ListFilesQuery {
  cursor?: string;
  limit?: number;
  mediaType?: MediaType;
  status?: FileStatus;
  search?: string;
}

/** Resposta resumida para listagem na galeria */
export interface FileResponse {
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

/** GET /api/files/:id — resposta completa */
export interface FileDetailResponse extends FileResponse {
  hash: string;
  chunksCount: number;
  replicationFactor: number;
  uploadedBy: {
    id: string;
    name: string;
  };
}

/** POST /api/files/upload — resposta 202 */
export interface UploadFileResponse {
  id: string;
  name: string;
  mimeType: string;
  originalSize: number;
  status: FileStatus;
  createdAt: string;
}

/** Metadata EXIF extraida durante o pipeline */
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
