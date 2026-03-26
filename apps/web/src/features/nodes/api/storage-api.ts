import { apiClient } from '@/lib/api-client';

export interface DedupStats {
  totalChunks: number;
  totalReferences: number;
  bytesStored: number;
  bytesLogical: number;
  bytesSaved: number;
  dedupRatio: number;
}

export const storageApi = {
  /** GET /api/storage/stats — estatísticas de deduplicação */
  stats: (): Promise<DedupStats> => apiClient.get<DedupStats>('/storage/stats'),
};
