/**
 * useUploadFiles — mutation de upload com integração ao uploadStore.
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 2: Upload)
 *
 * Max 3 uploads concorrentes. Polling do status via useFileDetail.
 */
'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUploadStore } from '@/store/upload-store';
import { filesApi } from '../api/files-api';

export function useUploadFiles() {
  const queryClient = useQueryClient();
  const addFiles = useUploadStore((s) => s.addFiles);
  const updateItem = useUploadStore((s) => s.updateItem);

  const upload = useCallback(
    async (files: File[]) => {
      addFiles(files);
      const items = useUploadStore.getState().items;
      const newItems = items.slice(-files.length);

      for (const item of newItems) {
        updateItem(item.id, { status: 'uploading' });
        try {
          await filesApi.upload(item.file);
          updateItem(item.id, { status: 'done', progress: 100 });
        } catch {
          updateItem(item.id, { status: 'error', error: 'Falha no upload' });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    [addFiles, updateItem, queryClient],
  );

  return { upload };
}
