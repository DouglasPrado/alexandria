/**
 * ClusterHealthSummary — resumo de saúde do cluster.
 * Fonte: docs/frontend/web/04-components.md (ClusterHealthSummary)
 * Design: Alexandria Protocol — Tonal Layering, no borders
 */
import { HardDrive, Wifi, WifiOff, Database } from 'lucide-react';
import type { NodeDTO } from '../types/node.types';
import { formatBytes } from '@/lib/format';

interface ClusterHealthSummaryProps {
  nodes: NodeDTO[];
}

export function ClusterHealthSummary({ nodes }: ClusterHealthSummaryProps) {
  const activeNodes = nodes.filter((n) => n.status !== 'disconnected');
  const onlineNodes = nodes.filter((n) => n.status === 'online');
  const offlineNodes = nodes.filter((n) => n.status === 'lost' || n.status === 'suspect');
  const totalCapacity = activeNodes.reduce((sum, n) => sum + n.totalCapacity, 0);
  const usedCapacity = activeNodes.reduce((sum, n) => sum + n.usedCapacity, 0);
  const totalChunks = activeNodes.reduce((sum, n) => sum + n.chunksStored, 0);

  const stats = [
    {
      label: 'Nós online',
      value: `${onlineNodes.length}/${activeNodes.length}`,
      icon: Wifi,
      color: offlineNodes.length > 0 ? 'var(--warning)' : 'var(--success)',
    },
    {
      label: 'Nós offline',
      value: offlineNodes.length.toString(),
      icon: WifiOff,
      color: offlineNodes.length > 0 ? 'var(--destructive)' : 'var(--muted-foreground)',
    },
    {
      label: 'Espaço total',
      value: formatBytes(totalCapacity),
      icon: HardDrive,
      color: 'var(--info)',
    },
    {
      label: 'Chunks armazenados',
      value: totalChunks.toLocaleString('pt-BR'),
      icon: Database,
      color: 'var(--accent)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-[var(--radius)] p-4"
            style={{ backgroundColor: 'var(--surface-container-lowest)' }}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
              <Icon size={14} style={{ color: stat.color }} />
              <span className="text-[var(--muted-foreground)] font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold font-display text-[var(--foreground)]">
              {stat.value}
            </div>
          </div>
        );
      })}

      {/* Global capacity bar */}
      {totalCapacity > 0 && (
        <div
          className="col-span-2 lg:col-span-4 rounded-[var(--radius)] p-4"
          style={{ backgroundColor: 'var(--surface-container-lowest)' }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--muted-foreground)]">Capacidade do cluster</span>
            <span className="text-[var(--foreground)] font-medium font-display">
              {formatBytes(usedCapacity)} / {formatBytes(totalCapacity)} ({Math.round((usedCapacity / totalCapacity) * 100)}%)
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--surface-container-highest)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round((usedCapacity / totalCapacity) * 100)}%`,
                backgroundColor: 'var(--tertiary-fixed-dim)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
