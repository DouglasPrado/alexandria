/**
 * Members API — camada de acesso a dados para membros e convites.
 * Fonte: docs/backend/05-api-contracts.md (Members/Invites endpoints)
 */
import { apiClient } from '@/lib/api-client';
import type {
  MemberDTO,
  InviteResultDTO,
  AcceptInviteResultDTO,
  CreateInviteInput,
  AcceptInviteInput,
} from '../types/member.types';

export const membersApi = {
  /** GET /api/clusters/:id/members — listar membros do cluster */
  list: (clusterId: string): Promise<MemberDTO[]> =>
    apiClient.get<MemberDTO[]>(`/clusters/${clusterId}/members`),

  /** POST /api/clusters/:id/invites — criar convite (admin) */
  invite: (clusterId: string, input: CreateInviteInput): Promise<InviteResultDTO> =>
    apiClient.post<InviteResultDTO>(`/clusters/${clusterId}/invites`, input),

  /** POST /api/invites/:token/accept — aceitar convite (publico) */
  accept: (token: string, input: AcceptInviteInput): Promise<AcceptInviteResultDTO> =>
    apiClient.post<AcceptInviteResultDTO>(`/invites/${token}/accept`, input),

  /** DELETE /api/clusters/:id/members/:memberId — remover membro (admin) */
  remove: (clusterId: string, memberId: string): Promise<void> =>
    apiClient.delete<void>(`/clusters/${clusterId}/members/${memberId}`),
};
