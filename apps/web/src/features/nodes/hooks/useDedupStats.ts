'use client';

import { useQuery } from '@tanstack/react-query';
import { storageApi } from '../api/storage-api';

export function useDedupStats() {
  return useQuery({
    queryKey: ['storage-stats'],
    queryFn: () => storageApi.stats(),
  });
}
