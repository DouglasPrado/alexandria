import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { NodeService } from './node.service';
import { type OAuthNodeType, isOAuthNodeType } from './oauth-storage-provider';
import { SessionKeyService } from '../../common/services/session-key.service';

interface BeginAuthorizationInput {
  provider: OAuthNodeType;
  memberId: string;
  clusterId: string;
  nodeName: string;
}

interface CompleteAuthorizationInput {
  code: string;
  state: string;
}

interface OAuthStatePayload {
  provider: OAuthNodeType;
  memberId: string;
  clusterId: string;
  nodeName: string;
  issuedAt: number;
}

interface OAuthTokenPayload {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface OAuthAccountProfile {
  accountEmail?: string;
  accountId?: string;
}

@Injectable()
export class NodeOAuthService {
  constructor(
    private readonly nodeService: NodeService,
    private readonly sessionKeyService: SessionKeyService,
  ) {}

  async beginAuthorization(input: BeginAuthorizationInput) {
    const state = this.signState({
      provider: input.provider,
      memberId: input.memberId,
      clusterId: input.clusterId,
      nodeName: input.nodeName,
      issuedAt: Date.now(),
    });

    return {
      provider: input.provider,
      state,
      authorizationUrl: this.buildAuthorizationUrl(input.provider, state),
    };
  }

  async completeAuthorization(input: CompleteAuthorizationInput) {
    const state = this.verifyState(input.state);
    const tokens = await this.exchangeCodeForTokens(state.provider, input.code);
    const profile = await this.fetchAccountProfile(state.provider, tokens.access_token);

    // Use cached admin password for vault sync (available if admin registered recently)
    const sessionData = this.sessionKeyService.get(state.memberId);

    const node = await this.nodeService.register(state.clusterId, state.memberId, {
      name: state.nodeName,
      type: state.provider,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : undefined,
      accountEmail: profile.accountEmail,
      accountId: profile.accountId,
      adminPassword: sessionData?.adminPassword,
    });

    return {
      provider: state.provider,
      node,
    };
  }

  private buildAuthorizationUrl(provider: OAuthNodeType, state: string): string {
    const redirectUri = this.callbackUrl(provider);

    switch (provider) {
      case 'google_drive':
        return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
          client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? '',
          redirect_uri: redirectUri,
          response_type: 'code',
          access_type: 'offline',
          prompt: 'consent',
          scope:
            'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email',
          state,
        }).toString()}`;
      case 'onedrive':
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams(
          {
            client_id: process.env.ONEDRIVE_CLIENT_ID ?? '',
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'offline_access Files.ReadWrite.AppFolder User.Read',
            state,
          },
        ).toString()}`;
      case 'dropbox':
        return `https://www.dropbox.com/oauth2/authorize?${new URLSearchParams({
          client_id: process.env.DROPBOX_CLIENT_ID ?? '',
          redirect_uri: redirectUri,
          response_type: 'code',
          token_access_type: 'offline',
          state,
        }).toString()}`;
    }
  }

  private callbackUrl(provider: OAuthNodeType): string {
    const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3333/api';
    return `${apiBaseUrl}/nodes/oauth/${provider}/callback`;
  }

  private signState(payload: OAuthStatePayload): string {
    const body = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const signature = createHmac(
      'sha256',
      process.env.OAUTH_STATE_SECRET ?? 'oauth-state-dev-secret',
    )
      .update(body)
      .digest('base64url');
    return `${body}.${signature}`;
  }

  private verifyState(state: string): OAuthStatePayload {
    const [body, signature] = state.split('.');
    if (!body || !signature) {
      throw new Error('OAuth state is invalid');
    }

    const expectedSignature = createHmac(
      'sha256',
      process.env.OAUTH_STATE_SECRET ?? 'oauth-state-dev-secret',
    )
      .update(body)
      .digest('base64url');

    const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    if (!isValid) {
      throw new Error('OAuth state signature is invalid');
    }

    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8'),
    ) as OAuthStatePayload;
    if (!isOAuthNodeType(payload.provider)) {
      throw new Error('OAuth provider is invalid');
    }
    return payload;
  }

  private async exchangeCodeForTokens(
    provider: OAuthNodeType,
    code: string,
  ): Promise<OAuthTokenPayload> {
    const redirectUri = this.callbackUrl(provider);
    let endpoint = '';
    let body = new URLSearchParams();

    switch (provider) {
      case 'google_drive':
        endpoint = 'https://oauth2.googleapis.com/token';
        body = new URLSearchParams({
          client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? '',
          client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        });
        break;
      case 'onedrive':
        endpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        body = new URLSearchParams({
          client_id: process.env.ONEDRIVE_CLIENT_ID ?? '',
          client_secret: process.env.ONEDRIVE_CLIENT_SECRET ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          scope: 'offline_access Files.ReadWrite.AppFolder User.Read',
        });
        break;
      case 'dropbox':
        endpoint = 'https://api.dropboxapi.com/oauth2/token';
        body = new URLSearchParams({
          client_id: process.env.DROPBOX_CLIENT_ID ?? '',
          client_secret: process.env.DROPBOX_CLIENT_SECRET ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        });
        break;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      throw new Error(`OAuth token exchange failed for ${provider}`);
    }
    return response.json() as Promise<OAuthTokenPayload>;
  }

  private async fetchAccountProfile(
    provider: OAuthNodeType,
    accessToken: string,
  ): Promise<OAuthAccountProfile> {
    switch (provider) {
      case 'google_drive': {
        const response = await fetch(
          'https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,permissionId),storageQuota',
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!response.ok) return {};
        const data = (await response.json()) as {
          user?: { emailAddress?: string; permissionId?: string };
        };
        return {
          accountEmail: data.user?.emailAddress,
          accountId: data.user?.permissionId,
        };
      }
      case 'onedrive': {
        const response = await fetch(
          'https://graph.microsoft.com/v1.0/me?$select=id,userPrincipalName',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok) return {};
        const data = (await response.json()) as { id?: string; userPrincipalName?: string };
        return {
          accountEmail: data.userPrincipalName,
          accountId: data.id,
        };
      }
      case 'dropbox': {
        const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return {};
        const data = (await response.json()) as { account_id?: string; email?: string };
        return {
          accountEmail: data.email,
          accountId: data.account_id,
        };
      }
    }
  }
}
