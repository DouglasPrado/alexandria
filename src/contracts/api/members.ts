import type { MemberRole } from '../enums/member-role';

/** POST /api/clusters/:id/invites */
export interface CreateInviteRequest {
  email: string;
  role: MemberRole.MEMBER | MemberRole.READER;
}

export interface CreateInviteResponse {
  id: string;
  token: string;
  inviteUrl: string;
  expiresAt: string;
  role: MemberRole;
}

/** POST /api/invites/:token/accept */
export interface AcceptInviteRequest {
  name: string;
  password: string;
}

export interface AcceptInviteResponse {
  member: MemberResponse;
  accessToken: string;
}

/** GET /api/clusters/:id/members */
export interface MemberResponse {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  clusterId: string;
  joinedAt: string;
}

/** PATCH /api/members/me */
export interface UpdateProfileRequest {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
}

/** PATCH /api/clusters/:id/members/:memberId/quota */
export interface SetQuotaRequest {
  bytes: number | null;
}

export interface SetQuotaResponse {
  id: string;
  storageQuotaBytes: number | null;
}
