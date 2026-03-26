/**
 * useClusterStats — query de estatísticas do cluster.
 * Fonte: docs/frontend/web/05-state.md (Queries por Domínio)
 *
 * staleTime: 30s | refetch: ao focar janela
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { clusterApi } from '../api/cluster-api';
import type { ClusterStatsDTO } from '../types/cluster.types';

export function useClusterStats() {
  const clusterId = useAuthStore((s) => s.member?.clusterId);

  return useQuery<ClusterStatsDTO>({
    queryKey: ['cluster', 'stats', clusterId],
    queryFn: () => clusterApi.stats(clusterId!),
    enabled: !!clusterId,
    staleTime: 30_000,
  });
}
