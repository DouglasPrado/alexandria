/** Grupo familiar que compartilha armazenamento distribuido. */
export interface Cluster {
  id: string;
  /** Hash da chave publica — identidade criptografica imutavel */
  clusterId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
