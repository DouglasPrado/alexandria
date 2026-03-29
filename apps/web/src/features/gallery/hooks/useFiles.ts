/**
 * useFiles — infinite scroll query para galeria.
 * Fonte: docs/frontend/web/05-state.md (Queries por Domínio)
 *
 * staleTime: 30s | polling: 3s se há arquivos processing | paginação: cursor-based
 */
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { filesApi } from '../api/files-api';
import type { FileFilters, FilesResponse } from '../types/file.types';

function hasProcessingFiles(pages: FilesResponse[] | undefined): boolean {
  if (!pages) return false;
  return pages.some((page) =>
    page.data.some((file) => file.status === 'processing'),
  );
}

export function useFiles(filters?: Omit<FileFilters, 'cursor'>) {
  return useInfiniteQuery<FilesResponse>({
    queryKey: ['files', filters],
    queryFn: ({ pageParam }) =>
      filesApi.list({ ...filters, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
    staleTime: 30_000,
    refetchInterval: (query) =>
      hasProcessingFiles(query.state.data?.pages) ? 3_000 : false,
  });
}
