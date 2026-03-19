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
  /** Limite de armazenamento em bytes (default 10 GB) */
  storageQuota: number;
  /** Uso atual em bytes */
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
}
