/**
 * useNodeMutations — mutations para register, drain e remove.
 * Fonte: docs/frontend/shared/06-data-layer.md (Hooks Principais)
 */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nodesApi } from '../api/nodes-api';
import type { OAuthNodeProvider, RegisterNodeRequest } from '../types/node.types';

export function useRegisterNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterNodeRequest) => nodesApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

export function useDrainNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) => nodesApi.drain(nodeId),
    onSuccess: (_, nodeId) => {
      // Optimistic: set status to draining
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['node', nodeId] });
    },
  });
}

export function useStartNodeOAuth() {
  return useMutation({
    mutationFn: ({ provider, nodeName }: { provider: OAuthNodeProvider; nodeName: string }) =>
      nodesApi.startOAuth(provider, nodeName),
  });
}

export function useRemoveNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) => nodesApi.remove(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

export function useRebalance() {
  return useMutation({
    mutationFn: () => nodesApi.rebalance(),
  });
}

export function useSetNodeTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, tier }: { nodeId: string; tier: string }) =>
      nodesApi.setTier(nodeId, tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}
