/**
 * ClusterDashboardPage — visão geral de saúde do cluster.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/cluster)
 * Design: Stitch — Alexandria Protocol (Tonal Layering, Asymmetric Grid)
 *
 * Rota: /dashboard/cluster
 * Auth: JWT (qualquer role)
 */
'use client';

import {
  Database,
  CheckCircle,
  BarChart3,
  MapPin,
  Filter,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { useClusterStats } from '@/features/cluster';
import { useNodes } from '@/features/nodes';
import { formatBytes } from '@/lib/format';
import type { NodeDTO } from '@/features/nodes';

export default function ClusterDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useClusterStats();
  const { data: nodes, isLoading: nodesLoading } = useNodes();

  if (statsLoading || nodesLoading) {
    return <ClusterSkeleton />;
  }

  if (!stats) return null;

  const usedPct =
    stats.totalStorage > 0
      ? Math.round((stats.usedStorage / stats.totalStorage) * 100)
      : 0;

  return (
    <div>
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider"
            style={{
              backgroundColor: 'var(--tertiary-fixed)',
              color: '#002113',
            }}
          >
            Active Cluster
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Nodes / {stats.name}
          </span>
        </div>
        <h2 className="text-4xl font-display font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Cluster {stats.name}
        </h2>
      </header>

      {/* Asymmetric Metrics Grid */}
      <div className="grid grid-cols-12 gap-6 mb-10">
        {/* Capacity Card (8 cols) */}
        <div
          className="col-span-12 lg:col-span-8 p-8 rounded-2xl relative overflow-hidden"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p
                  className="text-sm font-semibold uppercase tracking-widest mb-1"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Capacidade de Armazenamento
                </p>
                <h3 className="text-5xl font-display font-extrabold" style={{ color: 'var(--foreground)' }}>
                  {formatBytes(stats.usedStorage)}
                  <span className="text-2xl font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    {' '}/ {formatBytes(stats.totalStorage)}
                  </span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-display font-bold" style={{ color: 'var(--on-primary-container)' }}>
                  {usedPct}%
                </span>
                <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Uso atual do cluster
                </p>
              </div>
            </div>

            {/* Health Bar — continuous gradient */}
            <div
              className="h-4 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--surface-container-highest)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usedPct}%`,
                  background: 'linear-gradient(to right, var(--primary-container), var(--surface-tint))',
                }}
              />
            </div>

            {/* Sub-metrics */}
            <div className="grid grid-cols-3 gap-8 mt-10">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Fator de Replicação</p>
                <p className="text-2xl font-display font-bold">{stats.replicationFactor}x</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Arquivos Armazenados</p>
                <p className="text-2xl font-display font-bold">{stats.totalFiles}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nós de Armazenamento</p>
                <p className="text-2xl font-display font-bold">{stats.totalNodes}</p>
              </div>
            </div>
          </div>

          {/* Decorative blur */}
          <div
            className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(0, 27, 61, 0.05)' }}
          />
        </div>

        {/* Health Snapshot (4 cols) */}
        <div
          className="col-span-12 lg:col-span-4 p-8 rounded-2xl flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--surface-container-lowest)',
            border: '1px solid rgba(198, 198, 205, 0.1)',
          }}
        >
          <div>
            <h4
              className="text-sm font-bold uppercase tracking-widest mb-6"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Cluster Health
            </h4>
            <div className="space-y-6">
              <HealthRow
                dot="var(--tertiary-fixed)"
                glow
                label="Nós Online"
                value={`${nodes?.filter((n) => n.status === 'online').length ?? 0}/${nodes?.filter((n) => n.status !== 'disconnected').length ?? 0}`}
              />
              <HealthRow
                dot="var(--outline-variant)"
                label="Nós Offline"
                value={String(nodes?.filter((n) => n.status === 'lost' || n.status === 'suspect').length ?? 0)}
                muted
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database size={16} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-sm font-medium">Chunks Armazenados</span>
                </div>
                <span className="font-display font-bold">
                  {nodes?.reduce((sum, n) => sum + n.chunksStored, 0).toLocaleString('pt-BR') ?? '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Operational status */}
          <div style={{ borderTop: '1px solid var(--surface-container-low)' }} className="pt-6 mt-6">
            <div
              className="p-4 rounded-xl flex items-center gap-4"
              style={{ backgroundColor: 'var(--surface-container-low)' }}
            >
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-tight" style={{ color: 'var(--success)' }}>
                  Status Operacional
                </p>
                <p className="text-xs leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                  Todos os sistemas operando nominalmente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Status Table */}
      {nodes && nodes.length > 0 && (
        <section
          className="rounded-2xl p-1 mb-10"
          style={{ backgroundColor: 'var(--surface-container-lowest)' }}
        >
          <div className="p-6 pb-2 flex items-center justify-between">
            <h3 className="text-lg font-bold font-display">Status dos Nós Individuais</h3>
            <div className="flex gap-2">
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <Filter size={18} />
              </button>
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="text-[11px] uppercase tracking-widest font-bold"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <th className="px-8 py-4">Identificador do Nó</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Capacidade Total</th>
                  <th className="px-8 py-4">Chunks</th>
                  <th className="px-8 py-4">Latência</th>
                  <th className="px-8 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <NodeTableRow key={node.id} node={node} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Network Visualization */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic Stats */}
        <div
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: 'var(--surface-container-low)',
            border: '1px solid rgba(198, 198, 205, 0.1)',
          }}
        >
          <h4 className="font-display font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} style={{ color: 'var(--primary-container)' }} />
            Estatísticas de Tráfego
          </h4>
          <div
            className="h-48 w-full rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                Sem tráfego recente
              </p>
              <p className="text-[10px]" style={{ color: 'var(--outline-variant)' }}>
                Aguardando interações de armazenamento
              </p>
            </div>
          </div>
        </div>

        {/* Distribution Map */}
        <div
          className="p-6 rounded-2xl"
          style={{
            backgroundColor: 'var(--surface-container-low)',
            border: '1px solid rgba(198, 198, 205, 0.1)',
          }}
        >
          <h4 className="font-display font-bold mb-4 flex items-center gap-2">
            <MapPin size={18} style={{ color: 'var(--primary-container)' }} />
            Mapa de Distribuição
          </h4>
          <div
            className="h-48 w-full rounded-xl relative overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-container-high)' }}
          >
            {/* Map placeholder */}
            <div className="relative">
              <div
                className="absolute -inset-2 rounded-full animate-ping"
                style={{ backgroundColor: 'rgba(0, 27, 61, 0.2)' }}
              />
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: 'var(--primary-container)' }}
              />
            </div>
            <div
              className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(4px)',
                color: 'var(--foreground)',
              }}
            >
              PRADO, BRAZIL
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HealthRow({
  dot,
  label,
  value,
  glow,
  muted,
}: {
  dot: string;
  label: string;
  value: string;
  glow?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: dot,
            boxShadow: glow ? `0 0 8px ${dot}` : undefined,
          }}
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span
        className="font-display font-bold"
        style={muted ? { color: 'var(--muted-foreground)' } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function NodeTableRow({ node }: { node: NodeDTO }) {
  const isOnline = node.status === 'online';
  const usedPct =
    node.totalCapacity > 0
      ? Math.round((node.usedCapacity / node.totalCapacity) * 100)
      : 0;

  const timeSinceHeartbeat = node.lastHeartbeat
    ? getRelativeTime(node.lastHeartbeat)
    : '—';

  return (
    <tr
      className="group transition-colors"
      style={{ borderBottom: '1px solid var(--surface-container-low)' }}
    >
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div
            className="w-1.5 h-10 rounded-full"
            style={{
              backgroundColor: isOnline ? 'var(--tertiary-fixed)' : 'var(--destructive)',
            }}
          />
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
              {node.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              ID: {node.id.slice(0, 12)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
          style={{
            backgroundColor: isOnline
              ? 'rgba(111, 251, 190, 0.3)'
              : 'rgba(186, 26, 26, 0.15)',
            color: isOnline ? '#005236' : 'var(--destructive)',
          }}
        >
          {node.status.toUpperCase()}
        </span>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-sm">
            {formatBytes(node.totalCapacity)}
          </span>
          <div
            className="w-24 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--surface-container-highest)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${usedPct}%`,
                backgroundColor: 'var(--on-primary-container)',
              }}
            />
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {node.chunksStored.toLocaleString('pt-BR')} Chunks
        </span>
      </td>
      <td className="px-8 py-6">
        <span
          className="font-mono text-xs"
          style={{ color: 'var(--success)' }}
        >
          {timeSinceHeartbeat}
        </span>
      </td>
      <td className="px-8 py-6 text-right">
        <button style={{ color: 'var(--muted-foreground)' }}>
          <MoreVertical size={18} />
        </button>
      </td>
    </tr>
  );
}

function ClusterSkeleton() {
  return (
    <div data-testid="cluster-loading">
      <div className="mb-10">
        <div
          className="h-5 w-32 rounded animate-pulse mb-2"
          style={{ backgroundColor: 'var(--surface-container)' }}
        />
        <div
          className="h-10 w-64 rounded animate-pulse"
          style={{ backgroundColor: 'var(--surface-container)' }}
        />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div
          className="col-span-12 lg:col-span-8 h-64 rounded-2xl animate-pulse"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        />
        <div
          className="col-span-12 lg:col-span-4 h-64 rounded-2xl animate-pulse"
          style={{ backgroundColor: 'var(--surface-container-lowest)' }}
        />
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const ms = Math.abs(diff);
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return '<1ms';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
