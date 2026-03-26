/**
 * useNodeDetail — query para detalhe de nó + polling durante draining.
 * Fonte: docs/frontend/web/05-state.md (Queries por Domínio)
 *
 * staleTime: 10s | polling: 10s se status=draining
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { nodesApi } from '../api/nodes-api';

export function useNodeDetail(nodeId: string | null) {
  return useQuery({
    queryKey: ['node', nodeId],
    queryFn: () => nodesApi.detail(nodeId!),
    enabled: !!nodeId,
    staleTime: 10_000,
    refetchInterval: (query) =>
      query.state.data?.status === 'draining' ? 10_000 : false,
  });
}
