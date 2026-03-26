/**
 * ClusterDashboardPage — visão geral de saúde do cluster.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/cluster)
 * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Dashboard de Saúde do Cluster)
 *
 * Rota: /dashboard/cluster
 * Auth: JWT (qualquer role)
 */
'use client';

import { HardDrive, Files, Shield, Server } from 'lucide-react';
import { useClusterStats } from '@/features/cluster';
import { ClusterHealthSummary, useNodes } from '@/features/nodes';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ClusterDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useClusterStats();
  const { data: nodes, isLoading: nodesLoading } = useNodes();

  if (statsLoading || nodesLoading) {
    return (
      <div className="p-6" data-testid="cluster-loading">
        <div className="h-8 w-48 bg-[var(--muted)] rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[var(--muted)] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const usedPct = stats.totalStorage > 0
    ? Math.round((stats.usedStorage / stats.totalStorage) * 100)
    : 0;

  const statCards = [
    {
      label: 'Nós de armazenamento',
      value: String(stats.totalNodes),
      icon: Server,
      color: 'text-[var(--info)]',
    },
    {
      label: 'Arquivos armazenados',
      value: String(stats.totalFiles),
      icon: Files,
      color: 'text-[var(--accent)]',
    },
    {
      label: 'Fator de replicação',
      value: `${stats.replicationFactor}x`,
      icon: Shield,
      color: 'text-[var(--success)]',
    },
    {
      label: 'Armazenamento usado',
      value: `${formatBytes(stats.usedStorage)} / ${formatBytes(stats.totalStorage)}`,
      icon: HardDrive,
      color: usedPct > 80 ? 'text-[var(--destructive)]' : 'text-[var(--primary)]',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{stats.name}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Dashboard de saúde do cluster familiar
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4"
            >
              <div className={`flex items-center gap-2 text-sm mb-1 ${card.color}`}>
                <Icon size={14} />
                {card.label}
              </div>
              <div className="text-xl font-bold text-[var(--foreground)]">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Storage bar */}
      {stats.totalStorage > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--muted-foreground)]">Capacidade total do cluster</span>
            <span className="text-[var(--foreground)] font-medium">{usedPct}% utilizado</span>
          </div>
          <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usedPct}%`,
                backgroundColor: usedPct > 80 ? 'var(--destructive)' : 'var(--primary)',
              }}
            />
          </div>
        </div>
      )}

      {/* Node health breakdown */}
      {nodes && nodes.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
            Status dos Nós
          </h2>
          <ClusterHealthSummary nodes={nodes} />
        </div>
      )}
    </div>
  );
}
