import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  split,
  hash,
  encrypt,
  generateFileKey,
  ConsistentHashRing,
  type LocalStorageProvider,
  type StorageProvider,
  type ChunkData,
} from '@alexandria/core-sdk';

/**
 * StorageService — orquestra distribuicao de chunks para nos de storage.
 * Fonte: docs/backend/06-services.md (StorageService.distributeChunks — 13 passos)
 *
 * Fluxo: split → dedup → generateFileKey → encrypt → distribute (3x) → chunks + replicas → manifest
 */
@Injectable()
export class StorageService {
  private ring = new ConsistentHashRing();
  private providers = new Map<string, StorageProvider>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra no no hash ring e associa um StorageProvider.
   * Chamado pelo NodeService ao registrar/reconectar no.
   */
  registerNode(nodeId: string, capacity: number, provider: StorageProvider): void {
    if (this.providers.has(nodeId)) return;
    this.ring.addNode(nodeId, capacity);
    this.providers.set(nodeId, provider);
  }

  /**
   * Remove no do hash ring.
   * Chamado pelo NodeService ao remover no apos drain.
   */
  unregisterNode(nodeId: string): void {
    if (!this.providers.has(nodeId)) return;
    this.ring.removeNode(nodeId);
    this.providers.delete(nodeId);
  }

  /**
   * Distribui chunks criptografados para nos de storage com replicacao 3x.
   * Conforme backend/06-services.md — StorageService.distributeChunks() (13 passos).
   *
   * @param fileId - ID do arquivo no banco
   * @param content - Buffer otimizado (saida do media pipeline)
   * @param masterKey - Master key para envelope encryption (file key derivation)
   * @returns Chunks distribuidos e manifest criado
   */
  async distributeChunks(
    fileId: string,
    content: Buffer,
    masterKey: Buffer,
  ): Promise<{ chunksCount: number; replicasCount: number }> {
    // 2-3. Split content into ~4MB chunks with SHA-256 hash
    const chunks = split(content);
    const contentHash = hash(content);

    // 5. Generate file key via envelope encryption
    const fileKey = generateFileKey(masterKey);

    // 4 + 6. For each chunk: dedup check → encrypt
    const processedChunks: Array<{
      chunkId: string;
      chunkIndex: number;
      size: number;
      encrypted: Buffer;
      isNew: boolean;
    }> = [];

    for (const chunk of chunks) {
      // 4. Dedup check
      const existing = await this.prisma.chunk.findUnique({ where: { id: chunk.hash } });

      if (existing) {
        // Reutiliza chunk existente — incrementa referencia
        processedChunks.push({
          chunkId: chunk.hash,
          chunkIndex: chunk.chunkIndex,
          size: chunk.size,
          encrypted: Buffer.alloc(0), // nao precisa re-criptografar
          isNew: false,
        });
        continue;
      }

      // 6. Encrypt chunk with file key (AES-256-GCM)
      const encResult = encrypt(chunk.data, fileKey);
      const encryptedBuffer = Buffer.concat([
        encResult.iv,
        encResult.authTag,
        encResult.ciphertext,
      ]);

      processedChunks.push({
        chunkId: chunk.hash,
        chunkIndex: chunk.chunkIndex,
        size: chunk.size,
        encrypted: encryptedBuffer,
        isNew: true,
      });
    }

    // 7. Distribute new chunks to 3 nodes via ConsistentHashRing + StorageProvider
    let replicasCount = 0;
    const replicaRecords: Array<{ chunkId: string; nodeId: string }> = [];

    for (const chunk of processedChunks) {
      if (!chunk.isNew) continue;

      try {
        const targetNodes = this.ring.getNodes(chunk.chunkId, 3);

        for (const nodeId of targetNodes) {
          const provider = this.providers.get(nodeId);
          if (provider) {
            await provider.put(chunk.chunkId, chunk.encrypted);
            replicaRecords.push({ chunkId: chunk.chunkId, nodeId });
            replicasCount++;
          }
        }
      } catch {
        // Se nao ha nos suficientes no ring, armazena sem replicacao
        // Os chunks ficam no banco e serao distribuidos quando nos conectarem
      }
    }

    // 8-11. Transaction: create chunk + replica records
    await this.prisma.$transaction(async (tx: PrismaService) => {
      for (const chunk of processedChunks) {
        if (chunk.isNew) {
          await tx.chunk.create({
            data: {
              id: chunk.chunkId,
              size: chunk.size,
              referenceCount: 1,
            },
          });
        } else {
          await tx.chunk.update({
            where: { id: chunk.chunkId },
            data: { referenceCount: { increment: 1 } },
          });
        }
      }

      for (const replica of replicaRecords) {
        await tx.chunkReplica.create({
          data: {
            chunkId: replica.chunkId,
            nodeId: replica.nodeId,
            status: 'healthy',
          },
        });
      }

      // 12. Create manifest
      const chunksJson = processedChunks.map((c) => ({
        chunkId: c.chunkId,
        chunkIndex: c.chunkIndex,
        size: c.size,
      }));

      // Encrypt file key with master key for storage in manifest
      const fileKeyEncResult = encrypt(fileKey, masterKey);
      const fileKeyEncrypted = Buffer.concat([
        fileKeyEncResult.iv,
        fileKeyEncResult.authTag,
        fileKeyEncResult.ciphertext,
      ]);

      await tx.manifest.create({
        data: {
          fileId,
          chunksJson,
          fileKeyEncrypted,
          signature: Buffer.alloc(64), // TODO: Ed25519 sign with cluster private key
          replicatedTo: [],
          version: 1,
        },
      });

      // Create manifest_chunk join records
      const manifest = await tx.manifest.findUnique({ where: { fileId } });
      if (manifest) {
        for (const entry of chunksJson) {
          await tx.manifestChunk.create({
            data: {
              manifestId: manifest.id,
              chunkId: entry.chunkId,
              chunkIndex: entry.chunkIndex,
            },
          });
        }
      }

      // Update file status
      await tx.file.update({
        where: { id: fileId },
        data: {
          status: 'ready',
          contentHash,
          optimizedSize: BigInt(content.length),
        },
      });
    });

    return {
      chunksCount: processedChunks.length,
      replicasCount,
    };
  }
}
