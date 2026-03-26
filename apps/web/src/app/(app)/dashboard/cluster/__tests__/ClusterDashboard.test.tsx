/**
 * ClusterDashboard — testes de renderização do dashboard de saúde.
 * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Dashboard de Saúde do Cluster)
 * Fonte: docs/backend/05-api-contracts.md (GET /api/clusters/:id)
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ClusterDashboardPage from '../page';

// Mock hooks
vi.mock('@/features/cluster', () => ({
  useClusterStats: vi.fn(),
}));
vi.mock('@/features/nodes', () => ({
  useNodes: vi.fn(),
  ClusterHealthSummary: ({ nodes }: { nodes: unknown[] }) => (
    <div data-testid="cluster-health-summary">nodes: {nodes.length}</div>
  ),
}));
vi.mock('@/store/auth-store', () => ({
  useAuthStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ member: { clusterId: 'cluster-1', role: 'admin' } }),
  ),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { useClusterStats } from '@/features/cluster';
import { useNodes } from '@/features/nodes';

const GB = 1024 * 1024 * 1024;

const mockStats = {
  id: 'cluster-1',
  name: 'Família Prado',
  status: 'active' as const,
  totalNodes: 3,
  totalFiles: 142,
  totalStorage: 300 * GB,
  usedStorage: 90 * GB,
  replicationFactor: 3,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('ClusterDashboardPage', () => {
  it('exibe o nome do cluster', () => {
    vi.mocked(useClusterStats).mockReturnValue({ data: mockStats, isLoading: false } as any);
    vi.mocked(useNodes).mockReturnValue({ data: [], isLoading: false } as any);

    render(<ClusterDashboardPage />);

    expect(screen.getByText('Família Prado')).toBeInTheDocument();
  });

  it('exibe total de nós', () => {
    vi.mocked(useClusterStats).mockReturnValue({ data: mockStats, isLoading: false } as any);
    vi.mocked(useNodes).mockReturnValue({ data: [], isLoading: false } as any);

    render(<ClusterDashboardPage />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('exibe total de arquivos', () => {
    vi.mocked(useClusterStats).mockReturnValue({ data: mockStats, isLoading: false } as any);
    vi.mocked(useNodes).mockReturnValue({ data: [], isLoading: false } as any);

    render(<ClusterDashboardPage />);

    expect(screen.getByText('142')).toBeInTheDocument();
  });

  it('exibe fator de replicação', () => {
    vi.mocked(useClusterStats).mockReturnValue({ data: mockStats, isLoading: false } as any);
    vi.mocked(useNodes).mockReturnValue({ data: [], isLoading: false } as any);

    render(<ClusterDashboardPage />);

    expect(screen.getByText('3x')).toBeInTheDocument();
  });

  it('exibe capacidade usada e total formatadas no card de armazenamento', () => {
    vi.mocked(useClusterStats).mockReturnValue({ data: mockStats, isLoading: false } as any);
    vi.mocked(useNodes).mockReturnValue({ data: [], isLoading: false } as any);

    render(<ClusterDashboardPage />);

    // Card de storage mostra "X GB / Y GB"; barra mostra "30% utilizado"
    expect(screen.getByText(/Armazenamento usado/)).toBeInTheDocument();
    expect(screen.getByText(/30% utilizado/)).toBeInTheDocument();
  });

  it('exibe ClusterHealthSummary com os nós', () => {
    vi.mocked(useClusterStats).mockReturnValue({ data: mockStats, isLoading: false } as any);
    vi.mocked(useNodes).mockReturnValue({ data: [{ id: 'n1' }, { id: 'n2' }], isLoading: false } as any);

    render(<ClusterDashboardPage />);

    expect(screen.getByTestId('cluster-health-summary')).toBeInTheDocument();
    expect(screen.getByText('nodes: 2')).toBeInTheDocument();
  });

  it('exibe loading skeleton quando isLoading=true', () => {
    vi.mocked(useClusterStats).mockReturnValue({ data: undefined, isLoading: true } as any);
    vi.mocked(useNodes).mockReturnValue({ data: undefined, isLoading: true } as any);

    render(<ClusterDashboardPage />);

    expect(screen.getByTestId('cluster-loading')).toBeInTheDocument();
  });
});
