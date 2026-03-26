/**
 * useFileDetail — query para detalhe de arquivo + polling durante processing.
 * Fonte: docs/frontend/web/05-state.md (Queries por Domínio)
 *
 * staleTime: 30s | polling: 3s se status=processing
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { filesApi } from '../api/files-api';

export function useFileDetail(fileId: string | null) {
  return useQuery({
    queryKey: ['file', fileId],
    queryFn: () => filesApi.detail(fileId!),
    enabled: !!fileId,
    staleTime: 30_000,
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? 3_000 : false,
  });
}
