import type { MemberRole } from "../enums/member-role";

/** Pessoa autorizada a participar de um cluster. */
export interface Member {
  id: string;
  clusterId: string;
  name: string;
  email: string;
  role: MemberRole;
  invitedBy: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}
