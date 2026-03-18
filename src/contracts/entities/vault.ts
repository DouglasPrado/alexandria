/** Cofre criptografado individual por membro. */
export interface Vault {
  id: string;
  memberId: string;
  encryptionAlgorithm: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
