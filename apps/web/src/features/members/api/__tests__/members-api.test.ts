import { describe, it, expect, vi, afterEach } from 'vitest';
import { membersApi } from '../members-api';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('membersApi.list', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps paginated backend responses into a member array', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        {
          id: 'm1',
          name: 'Douglas',
          email: 'd@f.com',
          role: 'admin',
          clusterId: 'c1',
          joinedAt: '2025-01-01T00:00:00Z',
          storageQuotaBytes: null,
          usedStorageBytes: 0,
        },
      ],
      meta: {
        cursor: 'm1',
        hasMore: false,
      },
    } as never);

    const result = await membersApi.list('c1');

    expect(apiClient.get).toHaveBeenCalledWith('/clusters/c1/members');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('m1');
  });
});
