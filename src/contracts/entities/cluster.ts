import type { ClusterStatus } from '../enums/cluster-status';

/**
 * Cluster — Unidade raiz do sistema.
 * Representa uma familia com identidade criptografica derivada de seed phrase BIP-39.
 * cluster_id = SHA-256(public_key) — imutavel apos criacao (RN-C1).
 * Limites: max 10 membros (RN-C3), max 50 nos (RN-C4).
 */
export interface Cluster {
  id: string;
  clusterId: string;
  name: string;
  publicKey: Uint8Array;
  encryptedPrivateKey: Uint8Array;
  status: ClusterStatus;
  createdAt: Date;
  updatedAt: Date;
}
