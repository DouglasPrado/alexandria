/**
 * Role de um membro no cluster.
 * - admin: gerencia cluster, nos e membros
 * - member: faz upload e download
 * - reader: somente visualiza
 */
export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  READER = 'reader',
}
