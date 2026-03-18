import type { Member } from "../entities/member";
import type { MemberRole } from "../enums/member-role";

export interface InviteMemberRequest {
  email: string;
  name: string;
  role: MemberRole;
}

export interface InviteMemberResponse {
  inviteToken: string;
  expiresAt: string;
}

export interface ListMembersResponse {
  members: Member[];
}
