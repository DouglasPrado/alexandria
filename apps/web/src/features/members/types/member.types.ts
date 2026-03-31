/**
 * Tipos de Member e Invite para o frontend.
 * Fonte: docs/backend/05-api-contracts.md (Members/Invites endpoints)
 */

export interface MemberDTO {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'reader';
  clusterId: string;
  joinedAt: string;
  storageQuotaBytes: number | null;
  usedStorageBytes: number;
}

export interface MembersResponseDTO {
  data: MemberDTO[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
  };
}

export interface InviteResultDTO {
  id: string;
  token: string;
  inviteUrl: string;
  expiresAt: string;
  role: string;
}

export interface AcceptInviteResultDTO {
  member: MemberDTO;
  accessToken: string;
}

export interface CreateInviteInput {
  email: string;
  role: string;
}

export interface AcceptInviteInput {
  name: string;
  password: string;
}
