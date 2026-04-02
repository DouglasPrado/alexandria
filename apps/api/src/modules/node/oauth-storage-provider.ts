import { Buffer } from 'node:buffer';
import {
  LocalStorageProvider,
  S3StorageProvider,
  type StorageProvider,
} from '@alexandria/core-sdk';

export type OAuthNodeType = 'google_drive' | 'onedrive' | 'dropbox';

export interface OAuthNodeConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  accountEmail?: string;
  accountId?: string;
}

interface OAuthProviderHooks {
  onTokenRefresh?: (
    next: Pick<OAuthNodeConfig, 'accessToken' | 'refreshToken' | 'expiresAt'>,
  ) => Promise<void>;
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function parseText(response: Response): Promise<string> {
  return response.text();
}

async function createHttpError(response: Response, fallbackMessage: string): Promise<Error> {
  const body = await parseText(response).catch(() => '');
  const suffix = body ? `: ${body}` : '';
  return new Error(`${fallbackMessage} (HTTP ${response.status})${suffix}`);
}

abstract class OAuthStorageProvider implements StorageProvider {
  protected accessToken: string;
  protected refreshToken?: string;
  protected expiresAt?: string;

  constructor(
    config: OAuthNodeConfig,
    private readonly hooks: OAuthProviderHooks = {},
  ) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.expiresAt = config.expiresAt;
  }

  protected async authorizedFetch(url: string, init?: RequestInit): Promise<Response> {
    const send = () =>
      fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...(init?.headers ?? {}),
        },
      });

    let response = await send();
    if (response.status !== 401 || !this.refreshToken) {
      return response;
    }

    await this.refreshAccessToken();
    response = await send();
    return response;
  }

  protected async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('OAuth refresh token not available');
    }

    const next = await this.performRefresh(this.refreshToken);
    this.accessToken = next.access_token;
    this.refreshToken = next.refresh_token ?? this.refreshToken;
    this.expiresAt = next.expires_in
      ? new Date(Date.now() + next.expires_in * 1000).toISOString()
      : this.expiresAt;

    await this.hooks.onTokenRefresh?.({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.expiresAt,
    });
  }

  protected abstract performRefresh(refreshToken: string): Promise<OAuthTokenResponse>;

  abstract put(chunkId: string, data: Buffer): Promise<void>;
  abstract get(chunkId: string): Promise<Buffer>;
  abstract exists(chunkId: string): Promise<boolean>;
  abstract delete(chunkId: string): Promise<void>;
  abstract list(prefix?: string): Promise<string[]>;
  abstract capacity(): Promise<{ total: bigint; used: bigint }>;
}

export class GoogleDriveStorageProvider extends OAuthStorageProvider {
  private readonly metadataUrl = 'https://www.googleapis.com/drive/v3/files';
  private readonly uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files';

  private async findFile(chunkId: string): Promise<{ id: string; name: string } | null> {
    const response = await this.authorizedFetch(
      `${this.metadataUrl}?q=${encodeURIComponent(`name='${chunkId}' and 'appDataFolder' in parents and trashed=false`)}&fields=files(id,name)&spaces=appDataFolder`,
    );
    if (!response.ok) {
      return null;
    }
    const body = await parseJson<{ files?: Array<{ id: string; name: string }> }>(response);
    return body.files?.[0] ?? null;
  }

  async put(chunkId: string, data: Buffer): Promise<void> {
    const existing = await this.findFile(chunkId);
    if (existing) {
      const response = await this.authorizedFetch(
        `${this.uploadUrl}/${existing.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: data,
        },
      );
      if (!response.ok) {
        throw await createHttpError(response, 'Failed to update chunk in Google Drive');
      }
      return;
    }

    const boundary = `alexandria${Date.now()}`;
    const metadata = JSON.stringify({ name: chunkId, parents: ['appDataFolder'] });
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      ),
      Buffer.from(`--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
      Buffer.from(data),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await this.authorizedFetch(`${this.uploadUrl}?uploadType=multipart`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!response.ok) {
      throw await createHttpError(response, 'Failed to upload chunk to Google Drive');
    }
  }

  async get(chunkId: string): Promise<Buffer> {
    const existing = await this.findFile(chunkId);
    if (!existing) {
      throw new Error(`Chunk "${chunkId}" not found.`);
    }
    const response = await this.authorizedFetch(`${this.metadataUrl}/${existing.id}?alt=media`);
    if (!response.ok) {
      throw new Error(`Chunk "${chunkId}" not found.`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async exists(chunkId: string): Promise<boolean> {
    return Boolean(await this.findFile(chunkId));
  }

  async delete(chunkId: string): Promise<void> {
    const existing = await this.findFile(chunkId);
    if (!existing) return;
    await this.authorizedFetch(`${this.metadataUrl}/${existing.id}`, { method: 'DELETE' });
  }

  async list(prefix?: string): Promise<string[]> {
    const query = prefix
      ? `name contains '${prefix}' and 'appDataFolder' in parents and trashed=false`
      : `'appDataFolder' in parents and trashed=false`;
    const response = await this.authorizedFetch(
      `${this.metadataUrl}?q=${encodeURIComponent(query)}&fields=files(name)&pageSize=1000&spaces=appDataFolder`,
    );
    if (!response.ok) return [];
    const body = await parseJson<{ files?: Array<{ name: string }> }>(response);
    return (body.files ?? []).map((file) => file.name);
  }

  async capacity(): Promise<{ total: bigint; used: bigint }> {
    const response = await this.authorizedFetch(
      'https://www.googleapis.com/drive/v3/about?fields=storageQuota',
    );
    if (!response.ok) {
      return { total: 0n, used: 0n };
    }
    const body = await parseJson<{ storageQuota?: { limit?: string; usage?: string } }>(response);
    return {
      total: BigInt(body.storageQuota?.limit ?? '0'),
      used: BigInt(body.storageQuota?.usage ?? '0'),
    };
  }

  protected async performRefresh(refreshToken: string): Promise<OAuthTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!response.ok) {
      throw await createHttpError(response, 'Failed to refresh Google Drive token');
    }
    return parseJson<OAuthTokenResponse>(response);
  }
}

export class OneDriveStorageProvider extends OAuthStorageProvider {
  private readonly rootPath =
    'https://graph.microsoft.com/v1.0/me/drive/special/approot:/alexandria-chunks';

  private chunkUrl(chunkId: string): string {
    return `${this.rootPath}/${encodeURIComponent(chunkId)}`;
  }

  async put(chunkId: string, data: Buffer): Promise<void> {
    const response = await this.authorizedFetch(`${this.chunkUrl(chunkId)}:/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: data,
    });
    if (!response.ok) {
      throw new Error('Failed to upload chunk to OneDrive');
    }
  }

  async get(chunkId: string): Promise<Buffer> {
    const response = await this.authorizedFetch(`${this.chunkUrl(chunkId)}:/content`);
    if (!response.ok) {
      throw new Error(`Chunk "${chunkId}" not found.`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async exists(chunkId: string): Promise<boolean> {
    const response = await this.authorizedFetch(this.chunkUrl(chunkId));
    return response.ok;
  }

  async delete(chunkId: string): Promise<void> {
    await this.authorizedFetch(this.chunkUrl(chunkId), { method: 'DELETE' });
  }

  async list(prefix?: string): Promise<string[]> {
    const response = await this.authorizedFetch(`${this.rootPath}:/children?$select=name`);
    if (!response.ok) return [];
    const body = await parseJson<{ value?: Array<{ name: string }> }>(response);
    const names = (body.value ?? []).map((item) => item.name);
    return prefix ? names.filter((name) => name.startsWith(prefix)) : names;
  }

  async capacity(): Promise<{ total: bigint; used: bigint }> {
    const response = await this.authorizedFetch(
      'https://graph.microsoft.com/v1.0/me/drive?$select=quota',
    );
    if (!response.ok) {
      return { total: 0n, used: 0n };
    }
    const body = await parseJson<{ quota?: { total?: number; used?: number } }>(response);
    return {
      total: BigInt(body.quota?.total ?? 0),
      used: BigInt(body.quota?.used ?? 0),
    };
  }

  protected async performRefresh(refreshToken: string): Promise<OAuthTokenResponse> {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.ONEDRIVE_CLIENT_ID ?? '',
        client_secret: process.env.ONEDRIVE_CLIENT_SECRET ?? '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'offline_access Files.ReadWrite.AppFolder User.Read',
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to refresh OneDrive token');
    }
    return parseJson<OAuthTokenResponse>(response);
  }
}

export class DropboxStorageProvider extends OAuthStorageProvider {
  private readonly rootPath = '/alexandria-chunks';

  private chunkPath(chunkId: string): string {
    // Dropbox does not allow ':' in paths — replace with '_'
    return `${this.rootPath}/${chunkId.replace(/:/g, '_')}`;
  }

  async put(chunkId: string, data: Buffer): Promise<void> {
    const response = await this.authorizedFetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          autorename: false,
          mode: 'overwrite',
          mute: true,
          path: this.chunkPath(chunkId),
        }),
      },
      body: Buffer.from(data),
    });
    if (!response.ok) {
      throw await createHttpError(response, 'Failed to upload chunk to Dropbox');
    }
  }

  async get(chunkId: string): Promise<Buffer> {
    const response = await this.authorizedFetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Dropbox-API-Arg': JSON.stringify({ path: this.chunkPath(chunkId) }),
      },
    });
    if (!response.ok) {
      throw new Error(`Chunk "${chunkId}" not found.`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async exists(chunkId: string): Promise<boolean> {
    const response = await this.authorizedFetch('https://api.dropboxapi.com/2/files/get_metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: this.chunkPath(chunkId) }),
    });
    return response.ok;
  }

  async delete(chunkId: string): Promise<void> {
    await this.authorizedFetch('https://api.dropboxapi.com/2/files/delete_v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: this.chunkPath(chunkId) }),
    });
  }

  async list(prefix?: string): Promise<string[]> {
    const response = await this.authorizedFetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: this.rootPath }),
    });
    if (!response.ok) return [];
    const body = await parseJson<{ entries?: Array<{ name: string }> }>(response);
    // Restore ':' from '_' for prefixed keys (manifest_, preview_, filemeta_)
    const names = (body.entries ?? []).map((entry) => {
      const name = entry.name;
      if (name.startsWith('manifest_')) return name.replace('manifest_', 'manifest:');
      if (name.startsWith('preview_')) return name.replace('preview_', 'preview:');
      if (name.startsWith('filemeta_')) return name.replace('filemeta_', 'filemeta:');
      return name;
    });
    return prefix ? names.filter((name) => name.startsWith(prefix)) : names;
  }

  async capacity(): Promise<{ total: bigint; used: bigint }> {
    const response = await this.authorizedFetch(
      'https://api.dropboxapi.com/2/users/get_space_usage',
      {
        method: 'POST',
      },
    );
    if (!response.ok) {
      return { total: 0n, used: 0n };
    }
    const body = await parseJson<{ allocation?: { allocated?: number }; used?: number }>(response);
    return {
      total: BigInt(body.allocation?.allocated ?? 0),
      used: BigInt(body.used ?? 0),
    };
  }

  protected async performRefresh(refreshToken: string): Promise<OAuthTokenResponse> {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DROPBOX_CLIENT_ID ?? '',
        client_secret: process.env.DROPBOX_CLIENT_SECRET ?? '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to refresh Dropbox token');
    }
    return parseJson<OAuthTokenResponse>(response);
  }
}

export function isOAuthNodeType(type: string): type is OAuthNodeType {
  return type === 'google_drive' || type === 'onedrive' || type === 'dropbox';
}

export function createOAuthStorageProvider(
  type: OAuthNodeType,
  config: OAuthNodeConfig,
  hooks?: OAuthProviderHooks,
): StorageProvider {
  switch (type) {
    case 'google_drive':
      return new GoogleDriveStorageProvider(config, hooks);
    case 'onedrive':
      return new OneDriveStorageProvider(config, hooks);
    case 'dropbox':
      return new DropboxStorageProvider(config, hooks);
  }
}

export function createStorageProviderFromNodeConfig(
  type: string,
  config: Record<string, unknown>,
  hooks?: OAuthProviderHooks,
): StorageProvider {
  if (type === 'local') {
    return new LocalStorageProvider(String(config.path ?? config.endpoint ?? ''));
  }

  if (type === 's3' || type === 'r2' || type === 'b2' || type === 'vps') {
    const s3Config: ConstructorParameters<typeof S3StorageProvider>[0] = {
      region: String(config.region ?? 'us-east-1'),
      bucket: String(config.bucket ?? ''),
      accessKeyId: String(config.accessKey ?? ''),
      secretAccessKey: String(config.secretKey ?? ''),
    };
    if (config.endpoint) {
      s3Config.endpoint = String(config.endpoint);
    }
    return new S3StorageProvider(s3Config);
  }

  if (isOAuthNodeType(type)) {
    return createOAuthStorageProvider(
      type,
      {
        accessToken: String(config.accessToken ?? ''),
        refreshToken: config.refreshToken ? String(config.refreshToken) : undefined,
        expiresAt: config.expiresAt ? String(config.expiresAt) : undefined,
        accountEmail: config.accountEmail ? String(config.accountEmail) : undefined,
        accountId: config.accountId ? String(config.accountId) : undefined,
      },
      hooks,
    );
  }

  throw new Error(`Unsupported node type: ${type}`);
}

export async function parseResponseText(response: Response): Promise<string> {
  return parseText(response);
}
