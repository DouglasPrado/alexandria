import type { MemberRole } from '../enums/member-role';

/**
 * Invite — Convite para ingresso no cluster via token assinado.
 * Token assinado com chave privada do cluster; expiracao 7 dias (RN-I1).
 * Uso unico — apos aceite, accepted_at preenchido (RN-I2).
 * Somente admins podem criar convites (RN-I4).
 */
export interface Invite {
  id: string;
  clusterId: string;
  email: string;
  role: MemberRole;
  token: string;
  expiresAt: Date;
  createdBy: string;
  acceptedAt: Date | null;
  createdAt: Date;
}
