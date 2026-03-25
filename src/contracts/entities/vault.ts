/**
 * Vault — Cofre criptografado individual por membro (1:1).
 * Vault do admin contem config do cluster + credenciais de provedores (RN-V1).
 * Vault de membro regular contem credenciais pessoais (RN-V2).
 * Replicado em nos de storage para recovery via seed (RN-V3).
 * Desbloqueado com senha do membro; no recovery, com master key (RN-V4).
 */
export interface Vault {
  id: string;
  memberId: string;
  vaultData: Uint8Array;
  encryptionAlgorithm: string;
  replicatedTo: string[];
  isAdminVault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
