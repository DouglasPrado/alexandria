/**
 * Files API — camada de acesso a dados para galeria.
 * Fonte: docs/frontend/shared/06-data-layer.md (Hooks Principais)
 *        docs/backend/05-api-contracts.md (Files endpoints)
 */
import { apiClient } from '@/lib/api-client';
import type { FileDetailDTO, FileFilters, FilesResponse } from '../types/file.types';

export const filesApi = {
  /** GET /api/files — listagem paginada com filtros */
  list: (filters?: FileFilters): Promise<FilesResponse> => {
    const params: Record<string, string> = {};
    if (filters?.q) params.search = filters.q;
    if (filters?.mediaType) params.mediaType = filters.mediaType;
    if (filters?.cursor) params.cursor = filters.cursor;
    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    params.limit = '50';
    return apiClient.get<FilesResponse>('/files', params);
  },

  /** GET /api/files/:id — detalhe do arquivo */
  detail: (id: string): Promise<FileDetailDTO> =>
    apiClient.get<FileDetailDTO>(`/files/${id}`),

  /** POST /api/files/upload — upload multipart */
  upload: (file: File) => apiClient.upload<{ id: string }>('/files/upload', file),

  /** DELETE /api/files/:id — deletar arquivo */
  remove: (id: string): Promise<void> => apiClient.delete<void>(`/files/${id}`),

  /** GET /api/files/:id/download — retorna URL ou blob */
  downloadUrl: (id: string): string =>
    `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/files/${id}/download`,

  /** GET /api/files/:id/preview — retorna URL do preview */
  previewUrl: (id: string): string =>
    `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/files/${id}/preview`,
};
