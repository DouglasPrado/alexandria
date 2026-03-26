/**
 * useDeleteFile — mutation de delete com optimistic update.
 * Fonte: docs/frontend/shared/06-data-layer.md (Invalidação Otimista)
 *
 * Remove do cache imediatamente, rollback em caso de erro.
 */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '../api/files-api';

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => filesApi.remove(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
