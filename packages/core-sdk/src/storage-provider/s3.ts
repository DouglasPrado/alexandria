import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import type { StorageProvider } from './index';

/**
 * Configuracao do S3StorageProvider.
 * Cada no pode ter config diferente — credenciais vem do vault do membro.
 * Compativel com AWS S3, Cloudflare R2, Backblaze B2 (S3-compatible).
 */
export interface S3StorageConfig {
  /** Custom endpoint for S3-compatible providers (R2, B2, MinIO). Omit for AWS S3. */
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Prefixo opcional para chunk keys no bucket (ex: "chunks/") */
  prefix?: string;
}

/**
 * StorageProvider para provedores S3-compatible (AWS S3, Cloudflare R2, Backblaze B2).
 * Usa @aws-sdk/client-s3 v3 — funciona com qualquer provedor S3-compatible.
 *
 * Fonte: docs/backend/13-integrations.md (StorageProviderClient)
 * Fonte: docs/blueprint/06-system-architecture.md (StorageProvider S3/R2/B2)
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.prefix = config.prefix ?? '';

    this.client = new S3Client({
      ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  private key(chunkId: string): string {
    return `${this.prefix}${chunkId}`;
  }

  async put(chunkId: string, data: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(chunkId),
        Body: data,
      }),
    );
  }

  async get(chunkId: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.key(chunkId),
        }),
      );

      const bytes = await response.Body!.transformToByteArray();
      return Buffer.from(bytes);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'NoSuchKey') {
        throw new Error(`Chunk "${chunkId}" not found.`);
      }
      throw err;
    }
  }

  async exists(chunkId: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.key(chunkId),
        }),
      );
      return true;
    } catch (err: unknown) {
      const meta = (err as { $metadata?: { httpStatusCode?: number } }).$metadata;
      if (meta?.httpStatusCode === 404 || (err as { name?: string }).name === 'NotFound') {
        return false;
      }
      throw err;
    }
  }

  async delete(chunkId: string): Promise<void> {
    // S3 DeleteObject is idempotent — no error on non-existent key
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.key(chunkId),
      }),
    );
  }

  async list(prefix?: string): Promise<string[]> {
    const fullPrefix = prefix ? `${this.prefix}${prefix}` : this.prefix;
    const chunkIds: string[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: fullPrefix || undefined,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) {
            // Strip prefix to return only chunkId
            const id = this.prefix ? obj.Key.slice(this.prefix.length) : obj.Key;
            chunkIds.push(id);
          }
        }
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return chunkIds;
  }

  async capacity(): Promise<{ total: bigint; used: bigint }> {
    // S3 has no concept of "total capacity" — it's virtually unlimited.
    // We calculate used by summing object sizes in the bucket.
    let used = 0n;

    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.prefix || undefined,
      }),
    );

    if (response.Contents) {
      for (const obj of response.Contents) {
        used += BigInt(obj.Size ?? 0);
      }
    }

    // Total is reported as a large sentinel value for cloud (effectively unlimited)
    const total = BigInt(Number.MAX_SAFE_INTEGER);

    return { total, used };
  }

  /** Fecha conexoes do S3Client */
  destroy(): void {
    this.client.destroy();
  }
}
