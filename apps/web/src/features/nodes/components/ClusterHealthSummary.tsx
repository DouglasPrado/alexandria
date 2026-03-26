/**
 * ClusterHealthSummary — resumo de saúde do cluster.
 * Fonte: docs/frontend/web/04-components.md (ClusterHealthSummary)
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
      color: offlineNodes.length > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]',
    },
    {
      label: 'Nós offline',
      value: offlineNodes.length.toString(),
      icon: WifiOff,
      color: offlineNodes.length > 0 ? 'text-[var(--destructive)]' : 'text-[var(--muted-foreground)]',
    },
    {
      label: 'Espaço total',
      value: formatBytes(totalCapacity),
      icon: HardDrive,
      color: 'text-[var(--info)]',
    },
    {
      label: 'Chunks armazenados',
      value: totalChunks.toLocaleString('pt-BR'),
      icon: Database,
      color: 'text-[var(--accent)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4"
          >
            <div className={`flex items-center gap-2 text-sm mb-1 ${stat.color}`}>
              <Icon size={14} />
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</div>
          </div>
        );
      })}

      {/* Global capacity bar */}
      {totalCapacity > 0 && (
        <div className="col-span-2 lg:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--muted-foreground)]">Capacidade do cluster</span>
            <span className="text-[var(--foreground)] font-medium">
              {formatBytes(usedCapacity)} / {formatBytes(totalCapacity)} ({Math.round((usedCapacity / totalCapacity) * 100)}%)
            </span>
          </div>
          <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all"
              style={{ width: `${Math.round((usedCapacity / totalCapacity) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
