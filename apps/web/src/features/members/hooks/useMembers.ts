'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/members-api';
import type { CreateInviteInput, AcceptInviteInput } from '../types/member.types';

/** Lista membros do cluster */
export function useMembers(clusterId: string | undefined) {
  return useQuery({
    queryKey: ['members', clusterId],
    queryFn: () => membersApi.list(clusterId!),
    enabled: !!clusterId,
  });
}

/** Cria convite — invalida cache de membros apos sucesso */
export function useInvite(clusterId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInviteInput) => membersApi.invite(clusterId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', clusterId] });
    },
  });
}

/** Aceita convite (pagina publica) */
export function useAcceptInvite() {
  return useMutation({
    mutationFn: ({ token, ...input }: AcceptInviteInput & { token: string }) =>
      membersApi.accept(token, input),
  });
}

/** Define quota de armazenamento — invalida cache */
export function useSetQuota(clusterId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, bytes }: { memberId: string; bytes: number | undefined }) =>
      membersApi.setQuota(clusterId!, memberId, bytes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', clusterId] });
    },
  });
}

/** Remove membro — invalida cache */
export function useRemoveMember(clusterId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => membersApi.remove(clusterId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', clusterId] });
    },
  });
}
