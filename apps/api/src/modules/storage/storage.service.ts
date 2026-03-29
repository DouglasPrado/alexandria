import { Injectable, OnModuleInit } from '@nestjs/common';
import { resolve } from 'node:path';
import { createDecipheriv, createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  split,
  hash,
  encrypt,
  generateFileKey,
  encodeErasure,
  ConsistentHashRing,
  S3StorageProvider,
  LocalStorageProvider,
  type StorageProvider,
} from '@alexandria/core-sdk';

/** Path absoluto para chunks locais — configuravel via env ou default na raiz do monorepo */
const LOCAL_CHUNKS_DIR = process.env.LOCAL_STORAGE_PATH
  || resolve(process.cwd(), '../..', 'apps', 'data', 'chunks');

/**
 * StorageService — orquestra distribuicao de chunks para nos de storage.
 * Fonte: docs/backend/06-services.md (StorageService.distributeChunks — 13 passos)
 *
 * Fluxo: split → dedup → generateFileKey → encrypt → distribute (3x) → chunks + replicas → manifest
 * OnModuleInit: recarrega nos do banco no boot para reconstruir o hash ring.
 */
/** Ordem de preferencia de tier por tipo de midia */
const TIER_PREFERENCE: Record<string, string[]> = {
  photo:    ['hot', 'warm', 'cold'],
  video:    ['hot', 'warm', 'cold'],
  document: ['warm', 'hot', 'cold'],
  archive:  ['cold', 'warm', 'hot'],
};

@Injectable()
export class StorageService implements OnModuleInit {
  private ring = new ConsistentHashRing();
  private providers = new Map<string, StorageProvider>();
  private nodeTiers = new Map<string, string>();

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
            const localPath = node.endpoint
              ? (node.endpoint.startsWith('/') ? node.endpoint : resolve(process.cwd(), '../..', node.endpoint))
              : LOCAL_CHUNKS_DIR;
            provider = new LocalStorageProvider(localPath);
          } else {
            // Decrypt config from configEncrypted (RN-N4)
            const config = await this.decryptNodeConfig(node.configEncrypted, node.clusterId);
            if (!config) {
              console.log(`[StorageService] Skipping node ${node.id} (${node.type}) — failed to decrypt config`);
              continue;
            }

            const accessKeyId = config.accessKey || '';
            const secretAccessKey = config.secretKey || '';
            if (!accessKeyId || !secretAccessKey) {
              console.log(`[StorageService] Skipping node ${node.id} (${node.type}) — missing credentials`);
              continue;
            }

            // R2/B2/VPS need endpoint; AWS S3 derives from region
            const endpoint = config.endpoint || '';
            const needsEndpoint = node.type !== 's3';
            if (needsEndpoint && !endpoint) {
              console.log(`[StorageService] Skipping node ${node.id} (${node.type}) — missing endpoint`);
              continue;
            }

            const s3Config: ConstructorParameters<typeof S3StorageProvider>[0] = {
              region: config.region || 'us-east-1',
              bucket: config.bucket || '',
              accessKeyId,
              secretAccessKey,
            };
            if (endpoint) {
              s3Config.endpoint = endpoint;
            }

            provider = new S3StorageProvider(s3Config);
          }

          this.ring.addNode(node.id, 100);
          this.providers.set(node.id, provider);
        } catch {
          // Skip node if registration fails
        }
      }

      // In dev, if no valid nodes were loaded, ensure a local node exists
      // so the pipeline doesn't crash on an empty ring
      if (this.providers.size === 0 && process.env.NODE_ENV !== 'production') {
        await this.ensureLocalDevNode();
      }

      console.log(`[StorageService] Loaded ${this.providers.size} nodes into hash ring`);
    } catch {
      // Database may not be ready yet — nodes will be registered via NodeService
    }
  }

  /**
   * Garante que um no local existe no banco e no ring para dev.
   * Busca cluster/member existente para associar o no.
   * Reusa no existente se ja foi criado em boot anterior.
   */
  private async ensureLocalDevNode(): Promise<void> {
    const fallbackDir = LOCAL_CHUNKS_DIR;

    // Check if any local node already exists in DB (e.g. from previous boot or user-created)
    let localNode = await this.prisma.node.findFirst({
      where: { type: 'local' },
    });

    if (!localNode) {
      // Need a cluster + admin member to own the node
      const cluster = await this.prisma.cluster.findFirst();
      const admin = cluster
        ? await this.prisma.member.findFirst({
            where: { clusterId: cluster.id, role: 'admin' },
          })
        : null;

      if (!cluster || !admin) {
        console.log('[StorageService] No cluster/admin found — cannot create local dev node');
        return;
      }

      localNode = await this.prisma.node.create({
        data: {
          clusterId: cluster.id,
          ownerId: admin.id,
          type: 'local',
          name: 'Dev Local Node',
          endpoint: fallbackDir,
          status: 'online',
          totalCapacity: BigInt(0), // synced from filesystem on boot
          usedCapacity: BigInt(0),
          configEncrypted: Buffer.from('dev-local'),
          lastHeartbeat: new Date(),
          tier: 'warm',
        },
      });
      console.log(`[StorageService] Created local dev node ${localNode.id} at ${fallbackDir}`);
    }

    const localPath = localNode.endpoint.startsWith('/')
      ? localNode.endpoint
      : resolve(process.cwd(), '../..', localNode.endpoint);
    const provider = new LocalStorageProvider(localPath);
    this.ring.addNode(localNode.id, 100);
    this.providers.set(localNode.id, provider);

    // Sync totalCapacity from real filesystem
    try {
      const { total } = await provider.capacity();
      await this.prisma.node.update({
        where: { id: localNode.id },
        data: { totalCapacity: total },
      });
    } catch { /* ignore — capacity will be 0 until first write */ }

    console.log(`[StorageService] Registered local dev node ${localNode.id} at ${localPath}`);
  }

  /**
   * Registra no no hash ring e associa um StorageProvider.
   * Chamado pelo NodeService ao registrar/reconectar no.
   * @param tier - Tier do no: 'hot' | 'warm' | 'cold' (padrao 'warm')
   */
  registerNode(nodeId: string, capacity: number, provider: StorageProvider, tier = 'warm'): void {
    if (this.providers.has(nodeId)) return;
    this.ring.addNode(nodeId, capacity);
    this.providers.set(nodeId, provider);
    this.nodeTiers.set(nodeId, tier);
  }

  /**
   * Atualiza o tier de um no em memoria.
   * Chamado pelo NodeService apos persistir a mudanca no banco.
   */
  setNodeTier(nodeId: string, tier: string): void {
    this.nodeTiers.set(nodeId, tier);
  }

  /**
   * Retorna o StorageProvider associado a um no, ou undefined se nao registrado.
   */
  getProvider(nodeId: string): import('@alexandria/core-sdk').StorageProvider | undefined {
    return this.providers.get(nodeId);
  }

  /**
   * Remove no do hash ring.
   * Chamado pelo NodeService ao remover no apos drain.
   */
  unregisterNode(nodeId: string): void {
    if (!this.providers.has(nodeId)) return;
    this.ring.removeNode(nodeId);
    this.providers.delete(nodeId);
    this.nodeTiers.delete(nodeId);
  }

  /**
   * Retorna nodeIds ordenados por preferencia de tier para o mediaType dado.
   * Nos do tier preferido aparecem primeiro; em caso de empate, ordem estavel.
   */
  private getPreferredNodes(mediaType?: string): string[] {
    const priority = TIER_PREFERENCE[mediaType ?? ''] ?? TIER_PREFERENCE['document']!;
    return [...this.providers.keys()].sort((a, b) => {
      const ta = priority.indexOf(this.nodeTiers.get(a) ?? 'warm');
      const tb = priority.indexOf(this.nodeTiers.get(b) ?? 'warm');
      return ta - tb;
    });
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
    mediaType?: string,
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

    // Tier-aware node order: preferred tier first, fallback to others
    const preferredNodes = this.getPreferredNodes(mediaType);

    for (const chunk of processedChunks) {
      if (!chunk.isNew || replicationFactor === 0) continue;

      try {
        const targetNodes = preferredNodes.slice(0, replicationFactor);

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

    // Update usedCapacity on nodes that received replicas
    const sizeByChunk = new Map(processedChunks.map((c) => [c.chunkId, c.encrypted.length]));
    const capacityByNode = new Map<string, bigint>();
    for (const r of replicaRecords) {
      const current = capacityByNode.get(r.nodeId) ?? 0n;
      capacityByNode.set(r.nodeId, current + BigInt(sizeByChunk.get(r.chunkId) ?? 0));
    }
    for (const [nodeId, added] of capacityByNode) {
      await this.prisma.node.updateMany({
        where: { id: nodeId },
        data: { usedCapacity: { increment: added } },
      });
    }

    return {
      chunksCount: processedChunks.length,
      replicasCount,
    };
  }

  /**
   * Distribui chunks usando erasure coding RS(10,4).
   * Gera 14 shards (10 data + 4 parity) e distribui round-robin entre nos.
   * Qualquer 10 dos 14 shards reconstituem o arquivo original.
   * Fonte: docs/blueprint/11-build_plan.md (Fase 3 — Erasure coding 10+4)
   *
   * @param fileId   - ID do arquivo no banco
   * @param content  - Buffer otimizado (saida do media pipeline)
   * @param masterKey - Master key para envelope encryption
   */
  async distributeWithErasure(
    fileId: string,
    content: Buffer,
    masterKey: Buffer,
  ): Promise<{ shardsCount: number }> {
    const DATA_SHARDS = 10;
    const PARITY_SHARDS = 4;
    const TOTAL_SHARDS = DATA_SHARDS + PARITY_SHARDS; // 14

    const contentHash = hash(content);
    const fileKey = generateFileKey(masterKey);

    // RS(10,4): encode content into 14 equal-size shards
    const shards = encodeErasure(content, DATA_SHARDS, PARITY_SHARDS);

    // Encrypt file key with master key for manifest
    const fileKeyEncResult = encrypt(fileKey, masterKey);
    const fileKeyEncrypted = Buffer.concat([
      fileKeyEncResult.iv,
      fileKeyEncResult.authTag,
      fileKeyEncResult.ciphertext,
    ]);

    // Distribute shards round-robin across available nodes
    const nodeIds = [...this.providers.keys()];
    if (nodeIds.length === 0) {
      throw new Error('No nodes available for erasure distribution');
    }

    const shardRecords: Array<{ shardId: string; shardIndex: number; size: number; nodeId: string }> = [];

    for (let i = 0; i < TOTAL_SHARDS; i++) {
      const shard = shards[i]!;
      const shardHash = hash(shard);
      const nodeId = nodeIds[i % nodeIds.length]!;

      const encResult = encrypt(shard, fileKey);
      const encryptedBuffer = Buffer.concat([encResult.iv, encResult.authTag, encResult.ciphertext]);

      const provider = this.providers.get(nodeId)!;
      await provider.put(shardHash, encryptedBuffer);

      shardRecords.push({ shardId: shardHash, shardIndex: i, size: shard.length, nodeId });
    }

    // Transaction: chunk records + replicas + manifest
    await this.prisma.$transaction(async (tx) => {
      for (const rec of shardRecords) {
        const existing = await tx.chunk.findUnique({ where: { id: rec.shardId } });
        if (existing) {
          await tx.chunk.update({ where: { id: rec.shardId }, data: { referenceCount: { increment: 1 } } });
        } else {
          await tx.chunk.create({ data: { id: rec.shardId, size: rec.size, referenceCount: 1 } });
        }
        await tx.chunkReplica.create({ data: { chunkId: rec.shardId, nodeId: rec.nodeId, status: 'healthy' } });
      }

      const chunksJson = shardRecords.map((r) => ({ chunkId: r.shardId, chunkIndex: r.shardIndex, size: r.size }));

      const manifest = await tx.manifest.create({
        data: {
          fileId,
          chunksJson,
          fileKeyEncrypted,
          signature: Buffer.alloc(64),
          replicatedTo: [],
          version: 1,
          codingScheme: 'erasure',
          dataShards: DATA_SHARDS,
          parityShards: PARITY_SHARDS,
        },
      });

      for (const rec of shardRecords) {
        await tx.manifestChunk.create({
          data: { manifestId: manifest.id, chunkId: rec.shardId, chunkIndex: rec.shardIndex },
        });
      }

      await tx.file.update({
        where: { id: fileId },
        data: { status: 'ready', contentHash, optimizedSize: BigInt(content.length) },
      });
    });

    return { shardsCount: TOTAL_SHARDS };
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

    // Update usedCapacity on the node (best-effort — node may have been removed)
    await this.prisma.node.updateMany({
      where: { id: nodeId },
      data: { usedCapacity: { increment: BigInt(data.length) } },
    });

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

  /**
   * Re-replica um chunk de uma replica saudavel para um novo no.
   * Usado pelo auto-healing quando um no e perdido.
   * Fonte: docs/backend/06-services.md (HealthService.autoHeal — passo 3c)
   *
   * @param chunkId - SHA-256 do chunk a re-replicar
   * @param excludeNodeIds - Nos a excluir (no perdido + nos que ja tem replica)
   * @returns { targetNodeId, success }
   * @throws Error se nenhuma replica saudavel encontrada ou nenhum no disponivel
   */
  async reReplicateChunk(
    chunkId: string,
    excludeNodeIds: string[],
  ): Promise<{ targetNodeId: string; success: boolean }> {
    // 1. Encontrar replica saudavel para ler
    const healthyReplicas = await this.prisma.chunkReplica.findMany({
      where: {
        chunkId,
        status: 'healthy',
        nodeId: { notIn: excludeNodeIds },
      },
    });

    if (healthyReplicas.length === 0) {
      throw new Error(`No healthy replica found for chunk ${chunkId}`);
    }

    // 2. Ler chunk de uma replica saudavel
    const sourceReplica = healthyReplicas[0]!;
    const chunkData = await this.getFromNode(sourceReplica.nodeId, chunkId);

    // 3. Selecionar novo no destino via ConsistentHashRing (excluindo nos que ja tem replica)
    const allReplicaNodeIds = await this.prisma.chunkReplica.findMany({
      where: { chunkId, status: 'healthy' },
      select: { nodeId: true },
    });
    const excludeAll = [
      ...new Set([...excludeNodeIds, ...allReplicaNodeIds.map((r) => r.nodeId)]),
    ];

    const candidates = this.ring.getNodes(chunkId, 1, excludeAll);
    if (candidates.length === 0) {
      throw new Error(`No available node for re-replication of chunk ${chunkId}`);
    }

    const targetNodeId = candidates[0]!;
    const provider = this.providers.get(targetNodeId);
    if (!provider) {
      throw new Error(`Provider not found for target node ${targetNodeId}`);
    }

    // 4. Escrever chunk no novo no
    await provider.put(chunkId, chunkData);

    // 5. Criar registro de replica
    await this.prisma.chunkReplica.create({
      data: {
        chunkId,
        nodeId: targetNodeId,
        status: 'healthy',
      },
    });

    return { targetNodeId, success: true };
  }

  /**
   * Estatisticas de deduplicacao global (content-addressable chunks).
   * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Deduplicacao global)
   *
   * bytesLogical = soma(size × referenceCount) — o que seria armazenado sem dedup
   * bytesSaved   = bytesLogical - bytesStored
   * dedupRatio   = Math.round(bytesSaved / bytesLogical × 100)
   */
  async getDedupStats(): Promise<{
    totalChunks: number;
    totalReferences: number;
    bytesStored: number;
    bytesLogical: number;
    bytesSaved: number;
    dedupRatio: number;
  }> {
    const [totalChunks, sizeAgg, refAgg, logicalResult] = await Promise.all([
      this.prisma.chunk.count(),
      this.prisma.chunk.aggregate({ _sum: { size: true } }),
      this.prisma.chunk.aggregate({ _sum: { referenceCount: true } }),
      this.prisma.$queryRaw<[{ bytes_logical: bigint }]>`
        SELECT COALESCE(SUM(size * reference_count), 0)::bigint AS bytes_logical FROM chunks
      `,
    ]);

    const bytesStored = Number(sizeAgg._sum?.size ?? 0);
    const totalReferences = Number(refAgg._sum?.referenceCount ?? 0);
    const bytesLogical = Number((logicalResult as any)[0]?.bytes_logical ?? 0);
    const bytesSaved = Math.max(0, bytesLogical - bytesStored);
    const dedupRatio = bytesLogical > 0 ? Math.round((bytesSaved / bytesLogical) * 100) : 0;

    return { totalChunks, totalReferences, bytesStored, bytesLogical, bytesSaved, dedupRatio };
  }

  /**
   * Rebalanceia chunks entre os nos do anel consistente.
   * ADR-006: quando nos entram/saem, redireciona replicas para os nos ideais.
   *
   * Para cada chunk:
   * 1. Calcula nos ideais via ConsistentHashRing.getNodes(chunkId, 3)
   * 2. Compara com replicas atuais no banco
   * 3. Adiciona replicas em nos que devem ter o chunk mas nao tem
   * 4. Remove replicas de nos que nao devem ter o chunk (excesso >3)
   *
   * @returns { chunksRelocated, chunksSkipped, chunksFailed }
   */
  async rebalance(): Promise<{
    chunksRelocated: number;
    chunksSkipped: number;
    chunksFailed: number;
  }> {
    const nodeCount = this.ring.getNodeCount();
    if (nodeCount === 0) {
      return { chunksRelocated: 0, chunksSkipped: 0, chunksFailed: 0 };
    }

    const replicationFactor = Math.min(3, nodeCount);
    const chunks = await this.prisma.chunk.findMany();

    let chunksRelocated = 0;
    let chunksSkipped = 0;
    let chunksFailed = 0;

    for (const chunk of chunks) {
      try {
        // 1. Nos ideais para este chunk segundo o anel atual
        let idealNodes: string[];
        try {
          idealNodes = this.ring.getNodes(chunk.id, replicationFactor);
        } catch {
          chunksFailed++;
          continue;
        }

        // 2. Replicas atuais no banco
        const currentReplicas = await this.prisma.chunkReplica.findMany({
          where: { chunkId: chunk.id, status: 'healthy' },
        });
        const currentNodeIds = new Set(currentReplicas.map((r: any) => r.nodeId));
        const idealSet = new Set(idealNodes);

        const missingNodes = idealNodes.filter((n) => !currentNodeIds.has(n));
        const excessReplicas = currentReplicas.filter((r: any) => !idealSet.has(r.nodeId));

        if (missingNodes.length === 0 && excessReplicas.length === 0) {
          chunksSkipped++;
          continue;
        }

        // 3. Adiciona replicas nos nos que deveriam ter o chunk
        if (missingNodes.length > 0) {
          // Encontra uma replica saudavel para ler
          const source = currentReplicas.find(
            (r: any) => r.status === 'healthy' && this.providers.has(r.nodeId),
          );

          if (!source) {
            chunksFailed++;
            continue;
          }

          const chunkData = await this.getFromNode(source.nodeId, chunk.id);

          for (const targetNodeId of missingNodes) {
            const provider = this.providers.get(targetNodeId);
            if (!provider) continue;

            try {
              await provider.put(chunk.id, chunkData);
              await this.prisma.chunkReplica.create({
                data: { chunkId: chunk.id, nodeId: targetNodeId, status: 'healthy' },
              });
              chunksRelocated++;
            } catch (err) {
              console.error(
                `[Rebalance] Failed to copy chunk ${chunk.id.slice(0, 16)} to node ${targetNodeId}:`,
                err instanceof Error ? err.message : err,
              );
              chunksFailed++;
            }
          }
        }

        // 4. Remove replicas de nos que nao deveriam ter o chunk (excesso)
        for (const replica of excessReplicas) {
          try {
            await this.deleteFromNode(replica.nodeId, chunk.id);
            await this.prisma.chunkReplica.delete({ where: { id: replica.id } });
          } catch (err) {
            console.warn(
              `[Rebalance] Failed to remove excess replica ${replica.id}:`,
              err instanceof Error ? err.message : err,
            );
          }
        }
      } catch (err) {
        console.error(
          `[Rebalance] Error processing chunk ${chunk.id.slice(0, 16)}:`,
          err instanceof Error ? err.message : err,
        );
        chunksFailed++;
      }
    }

    return { chunksRelocated, chunksSkipped, chunksFailed };
  }

  /**
   * Remove dados de um no especifico.
   * Idempotente — nao lanca erro se chave nao existe.
   */
  async deleteFromNode(nodeId: string, key: string): Promise<void> {
    const provider = this.providers.get(nodeId);
    if (!provider) return; // node may have been removed — skip silently
    await provider.delete(key);
  }

  /**
   * Descriptografa configEncrypted de um no (AES-256-GCM).
   * Chave derivada de SHA-256(encrypted_private_key) do cluster.
   * Formato: iv(12) + authTag(16) + ciphertext
   */
  private async decryptNodeConfig(
    configEncrypted: Buffer | Uint8Array | null | undefined,
    clusterId: string,
  ): Promise<{ endpoint?: string; bucket?: string; accessKey?: string; secretKey?: string; region?: string } | null> {
    if (!configEncrypted || configEncrypted.length < 29) return null;
    try {
      const buf = Buffer.from(configEncrypted);
      const key = await this.getEncryptionKey(clusterId);
      const iv = buf.subarray(0, 12);
      const authTag = buf.subarray(12, 28);
      const ciphertext = buf.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return JSON.parse(decrypted.toString('utf-8'));
    } catch {
      return null;
    }
  }

  /**
   * Deriva chave AES-256 a partir do encrypted_private_key do cluster.
   * seed phrase → master key → encrypted_private_key (DB) → SHA-256 → node config key.
   */
  private async getEncryptionKey(clusterId: string): Promise<Buffer> {
    const cluster = await this.prisma.cluster.findUnique({
      where: { id: clusterId },
      select: { encryptedPrivateKey: true },
    });
    if (!cluster?.encryptedPrivateKey) {
      throw new Error(`Cluster ${clusterId} not found or missing encrypted_private_key`);
    }
    return createHash('sha256').update(Buffer.from(cluster.encryptedPrivateKey)).digest();
  }
}
