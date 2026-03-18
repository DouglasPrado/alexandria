export const MemberRole = {
  ADMIN: "admin",
  MEMBRO: "membro",
  LEITURA: "leitura",
} as const;

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];
