import type { FileStatus } from "../enums/file-status";
import type { MediaType } from "../enums/media-type";

/** Representacao logica de uma foto, video ou documento no cluster. */
export interface File {
  id: string;
  clusterId: string;
  uploadedBy: string;
  originalName: string;
  mediaType: MediaType;
  mimeType: string;
  fileExtension: string;
  /** Bytes antes de otimizacao */
  originalSize: number;
  /** Bytes apos pipeline de midia */
  optimizedSize: number;
  /** SHA-256 do conteudo otimizado */
  contentHash: string;
  metadata: Record<string, unknown> | null;
  previewChunkId: string | null;
  status: FileStatus;
  /** Numero da versao (1 = original, 2+ = re-uploads) */
  version: number;
  /** ID da versao anterior (linked list de versoes) */
  parentId: string | null;
  /** Ultimo acesso para politica de tiering (hot/warm/cold) */
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}
