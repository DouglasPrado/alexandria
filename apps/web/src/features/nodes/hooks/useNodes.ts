/**
 * useNodes — query para lista de nós do cluster.
 * Fonte: docs/frontend/web/05-state.md (Queries por Domínio)
 *
 * staleTime: 30s | polling: nenhum
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { nodesApi } from '../api/nodes-api';

export function useNodes() {
  return useQuery({
    queryKey: ['nodes'],
    queryFn: () => nodesApi.list(),
    staleTime: 30_000,
  });
}
