import type { MemberRole } from '../enums/member-role';

/**
 * Member — Pessoa que pertence a um cluster familiar.
 * Email unico dentro do cluster (RN-M1).
 * Pelo menos 1 admin por cluster (RN-M2).
 * Ingressa via convite assinado (RN-M4), exceto o criador.
 */
export interface Member {
  id: string;
  clusterId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: MemberRole;
  invitedBy: string | null;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
