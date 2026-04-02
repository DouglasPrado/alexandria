/**
 * Files API — camada de acesso a dados para galeria.
 * Fonte: docs/frontend/shared/06-data-layer.md (Hooks Principais)
 *        docs/backend/05-api-contracts.md (Files endpoints)
 */
import { apiClient } from '@/lib/api-client';
import type { FileDetailDTO, FileFilters, FilesResponse, FileVersionDTO } from '../types/file.types';

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

  /** POST /api/files/:id/download-token → URL direta ao backend (bypass proxy) */
  getDownloadUrl: async (id: string): Promise<string> => {
    const res = await apiClient.post<{ downloadUrl: string }>(`/files/${id}/download-token`);
    return res.downloadUrl;
  },

  /** Fallback URL via proxy (para arquivos pequenos) */
  downloadUrl: (id: string): string =>
    `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/files/${id}/download`,

  /** GET /api/files/:id/preview — retorna URL do preview */
  previewUrl: (id: string): string =>
    `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/files/${id}/preview`,

  /** GET /api/files/:id/versions — lista versoes do arquivo */
  versions: (id: string): Promise<FileVersionDTO[]> =>
    apiClient.get<FileVersionDTO[]>(`/files/${id}/versions`),

  /** POST /api/files/:id/versions — cria nova versao */
  createVersion: (id: string, file: File): Promise<FileVersionDTO> =>
    apiClient.upload<FileVersionDTO>(`/files/${id}/versions`, file),
};
