/**
 * useFiles — infinite scroll query para galeria.
 * Fonte: docs/frontend/web/05-state.md (Queries por Domínio)
 *
 * staleTime: 30s | polling: nenhum | paginação: cursor-based
 */
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { filesApi } from '../api/files-api';
import type { FileFilters, FilesResponse } from '../types/file.types';

export function useFiles(filters?: Omit<FileFilters, 'cursor'>) {
  return useInfiniteQuery<FilesResponse>({
    queryKey: ['files', filters],
    queryFn: ({ pageParam }) =>
      filesApi.list({ ...filters, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
    staleTime: 30_000,
  });
}
