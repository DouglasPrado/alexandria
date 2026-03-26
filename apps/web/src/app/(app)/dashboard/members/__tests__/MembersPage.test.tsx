/**
 * MembersPage — testes de exibição de quota e ação de definir quota.
 * Fonte: docs/blueprint/14-scalability.md (Quotas por usuário)
 * Fonte: docs/backend/05-api-contracts.md (PATCH /api/clusters/:id/members/:memberId/quota)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MembersPage from '../page';

vi.mock('@/store/auth-store', () => ({
  useAuthStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ member: { id: 'm1', name: 'Douglas', email: 'd@f.com', role: 'admin', clusterId: 'c1' } }),
  ),
}));

vi.mock('@/features/members', () => ({
  useMembers: vi.fn(),
  useInvite: vi.fn(),
  useRemoveMember: vi.fn(),
  useSetQuota: vi.fn(),
}));

import { useMembers, useInvite, useRemoveMember, useSetQuota } from '@/features/members';

const mockMembers = [
  { id: 'm1', name: 'Douglas', email: 'd@f.com', role: 'admin', clusterId: 'c1', joinedAt: '2025-01-01T00:00:00Z', storageQuotaBytes: null, usedStorageBytes: 50 * 1024 * 1024 },
  { id: 'm2', name: 'Maria', email: 'm@f.com', role: 'member', clusterId: 'c1', joinedAt: '2025-02-01T00:00:00Z', storageQuotaBytes: 500 * 1024 * 1024, usedStorageBytes: 120 * 1024 * 1024 },
];

describe('MembersPage — quota', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMembers).mockReturnValue({ data: mockMembers, isLoading: false } as any);
    vi.mocked(useInvite).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any);
    vi.mocked(useRemoveMember).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    vi.mocked(useSetQuota).mockReturnValue({ mutate: mockMutate, isPending: false } as any);
  });

  it('exibe "Ilimitado" para membro sem quota definida', () => {
    render(<MembersPage />);
    expect(screen.getByText(/ilimitado/i)).toBeInTheDocument();
  });

  it('exibe quota formatada em MB/GB para membro com quota', () => {
    render(<MembersPage />);
    // 500MB quota
    expect(screen.getByText(/500\s*MB/i)).toBeInTheDocument();
  });

  it('exibe uso atual de storage por membro', () => {
    render(<MembersPage />);
    // 120MB de uso para Maria
    expect(screen.getByText(/120\s*MB/i)).toBeInTheDocument();
  });
});
