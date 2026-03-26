/**
 * Nodes API — camada de acesso a dados para gerenciamento de nós.
 * Fonte: docs/backend/05-api-contracts.md (Nodes endpoints)
 */
import { apiClient } from '@/lib/api-client';
import type {
  DrainNodeResponse,
  NodeDTO,
  RegisterNodeRequest,
} from '../types/node.types';

export const nodesApi = {
  /** GET /api/nodes — listar nós do cluster (backend retorna array direto) */
  list: (): Promise<NodeDTO[]> => apiClient.get<NodeDTO[]>('/nodes'),

  /** GET /api/nodes/:id — detalhe do nó */
  detail: (id: string): Promise<NodeDTO> => apiClient.get<NodeDTO>(`/nodes/${id}`),

  /** POST /api/nodes — registrar novo nó */
  register: (data: RegisterNodeRequest): Promise<NodeDTO> =>
    apiClient.post<NodeDTO>('/nodes', data),

  /** POST /api/nodes/:id/drain — iniciar drain */
  drain: (id: string): Promise<DrainNodeResponse> =>
    apiClient.post<DrainNodeResponse>(`/nodes/${id}/drain`),

  /** DELETE /api/nodes/:id — remover nó após drain */
  remove: (id: string): Promise<void> => apiClient.delete<void>(`/nodes/${id}`),

  /** PATCH /api/nodes/:id/tier — alterar tier do nó */
  setTier: (id: string, tier: string): Promise<{ id: string; tier: string }> =>
    apiClient.patch(`/nodes/${id}/tier`, { tier }),

  /** POST /api/nodes/rebalance — rebalancear chunks entre nós */
  rebalance: (): Promise<{ chunksRelocated: number; chunksSkipped: number; chunksFailed: number }> =>
    apiClient.post('/nodes/rebalance'),
};
