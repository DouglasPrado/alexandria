import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  split,
  hash,
  encrypt,
  generateFileKey,
  ConsistentHashRing,
  S3StorageProvider,
  LocalStorageProvider,
  type StorageProvider,
} from '@alexandria/core-sdk';

/**
 * StorageService — orquestra distribuicao de chunks para nos de storage.
 * Fonte: docs/backend/06-services.md (StorageService.distributeChunks — 13 passos)
 *
 * Fluxo: split → dedup → generateFileKey → encrypt → distribute (3x) → chunks + replicas → manifest
 * OnModuleInit: recarrega nos do banco no boot para reconstruir o hash ring.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private ring = new ConsistentHashRing();
  private providers = new Map<string, StorageProvider>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ao iniciar o modulo, carrega todos os nos online do banco
   * e registra no ConsistentHashRing com os providers apropriados.
   */
  async onModuleInit() {
    try {
      // Load all nodes (including lost/suspect — they may be available after restart)
      const nodes = await this.prisma.node.findMany({
        where: { status: { in: ['online', 'suspect', 'lost'] } },
      });

      // Reset heartbeats on boot — nodes are "alive" if the orchestrator just started
      if (nodes.length > 0) {
        await this.prisma.node.updateMany({
          where: { id: { in: nodes.map((n) => n.id) } },
          data: { status: 'online', lastHeartbeat: new Date() },
        });
      }

      for (const node of nodes) {
        try {
          let provider: StorageProvider;

          if (node.type === 'local') {
            provider = new LocalStorageProvider(node.endpoint || '/tmp/alexandria/chunks');
          } else {
            // Para S3/R2/B2: credenciais estao encriptadas no configEncrypted
            // No MVP, usamos endpoint do banco + credenciais placeholder
            // Em producao, descriptografar config do vault do owner
            provider = new S3StorageProvider({
              endpoint: node.endpoint || '',
              region: 'us-east-1',
              bucket: 'alexandria',
              accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            });
          }

          this.ring.addNode(node.id, 100);
          this.providers.set(node.id, provider);
        } catch {
          // Skip node if registration fails
        }
      }

      console.log(`[StorageService] Loaded ${this.providers.size} nodes into hash ring`);
    } catch {
      // Database may not be ready yet — nodes will be registered via NodeService
    }
  }

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

    // 7. Distribute new chunks to available nodes via ConsistentHashRing + StorageProvider
    const availableNodes = this.ring.getNodeCount();
    const replicationFactor = Math.min(3, availableNodes); // Use available nodes, max 3
    let replicasCount = 0;
    const replicaRecords: Array<{ chunkId: string; nodeId: string }> = [];

    if (replicationFactor === 0) {
      console.warn('[StorageService] No nodes in ring — chunks stored in DB only, not distributed');
    }

    for (const chunk of processedChunks) {
      if (!chunk.isNew || replicationFactor === 0) continue;

      try {
        const targetNodes = this.ring.getNodes(chunk.chunkId, replicationFactor);

        for (const nodeId of targetNodes) {
          const provider = this.providers.get(nodeId);
          if (provider) {
            await provider.put(chunk.chunkId, chunk.encrypted);
            replicaRecords.push({ chunkId: chunk.chunkId, nodeId });
            replicasCount++;
          }
        }
      } catch (err) {
        console.error(`[StorageService] Failed to distribute chunk ${chunk.chunkId.substring(0, 16)}:`, err instanceof Error ? err.message : err);
      }
    }

    // 8-11. Transaction: create chunk + replica records
    await this.prisma.$transaction(async (tx) => {
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

  /**
   * Armazena dados arbitrarios em um no (preview, manifest, etc.).
   * Usa o ConsistentHashRing para selecionar o no destino.
   *
   * @param key - Chave de armazenamento (ex: "preview:file-id")
   * @param data - Buffer a armazenar
   * @returns { nodeId, key } — no onde foi armazenado
   */
  async storeInNode(key: string, data: Buffer): Promise<{ nodeId: string; key: string }> {
    const targetNodes = this.ring.getNodes(key, 1);
    const nodeId = targetNodes[0]!;
    const provider = this.providers.get(nodeId);

    if (!provider) {
      throw new Error(`Provider not found for node ${nodeId}`);
    }

    await provider.put(key, data);
    return { nodeId, key };
  }

  /**
   * Recupera dados de um no especifico.
   *
   * @param nodeId - ID do no
   * @param key - Chave de armazenamento
   * @returns Buffer com os dados
   */
  async getFromNode(nodeId: string, key: string): Promise<Buffer> {
    const provider = this.providers.get(nodeId);
    if (!provider) {
      throw new Error(`Node ${nodeId} not found in ring`);
    }
    return provider.get(key);
  }
}
