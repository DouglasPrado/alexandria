'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../api/alerts-api';

/**
 * Hook para listar alertas com filtro por status.
 * Fonte: docs/frontend/shared/06-data-layer.md (Hooks Principais)
 */
export function useAlerts(resolved?: boolean) {
  return useQuery({
    queryKey: ['alerts', { resolved }],
    queryFn: () => alertsApi.list(resolved),
    refetchInterval: 30_000, // refresh a cada 30s
  });
}

/**
 * Hook para resolver alerta — invalida cache apos sucesso.
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => alertsApi.resolve(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
