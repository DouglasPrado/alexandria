import { Test } from '@nestjs/testing';
import { NodeOAuthService } from '../../src/modules/node/node-oauth.service';
import { NodeService } from '../../src/modules/node/node.service';
import { SessionKeyService } from '../../src/common/services/session-key.service';

describe('NodeOAuthService', () => {
  const mockNodeService = {
    register: jest.fn(),
  };

  const mockSessionKeyService = {
    get: jest.fn().mockReturnValue(null),
    store: jest.fn(),
    clear: jest.fn(),
  };

  let service: NodeOAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.WEB_CLIENT_URL = 'http://localhost:3000';
    process.env.GOOGLE_DRIVE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = 'google-secret';
    process.env.ONEDRIVE_CLIENT_ID = 'onedrive-client-id';
    process.env.ONEDRIVE_CLIENT_SECRET = 'onedrive-secret';
    process.env.DROPBOX_CLIENT_ID = 'dropbox-client-id';
    process.env.DROPBOX_CLIENT_SECRET = 'dropbox-secret';
    process.env.OAUTH_STATE_SECRET = 'state-secret';

    const module = await Test.createTestingModule({
      providers: [
        NodeOAuthService,
        { provide: NodeService, useValue: mockNodeService },
        { provide: SessionKeyService, useValue: mockSessionKeyService },
      ],
    }).compile();

    service = module.get(NodeOAuthService);
  });

  it('should create a Google Drive authorization URL with provider scopes', async () => {
    const result = await service.beginAuthorization({
      provider: 'google_drive',
      memberId: 'member-1',
      clusterId: 'cluster-1',
      nodeName: 'Drive da Familia',
    });

    expect(result.authorizationUrl).toContain('accounts.google.com');
    expect(result.authorizationUrl).toContain('drive.file');
    expect(result.authorizationUrl).toContain('access_type=offline');
  });

  it('should exchange callback code and register an oauth node', async () => {
    const begin = await service.beginAuthorization({
      provider: 'google_drive',
      memberId: 'member-1',
      clusterId: 'cluster-1',
      nodeName: 'Drive da Familia',
    });

    const fetchMock = jest
      .spyOn(global, 'fetch' as never)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          scope: 'https://www.googleapis.com/auth/drive.file',
          token_type: 'Bearer',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { emailAddress: 'family@example.com' },
          storageQuota: { limit: '1000', usage: '250' },
        }),
      } as Response);

    mockNodeService.register.mockResolvedValue({
      id: 'node-google-1',
      name: 'Drive da Familia',
      type: 'google_drive',
      status: 'online',
    });

    const result = await service.completeAuthorization({
      code: 'oauth-code',
      state: begin.state,
    });

    expect(mockNodeService.register).toHaveBeenCalledWith(
      'cluster-1',
      'member-1',
      expect.objectContaining({
        name: 'Drive da Familia',
        type: 'google_drive',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accountEmail: 'family@example.com',
      }),
    );
    expect(result.node.id).toBe('node-google-1');

    fetchMock.mockRestore();
  });
});
