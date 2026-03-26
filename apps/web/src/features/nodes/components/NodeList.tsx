/**
 * NodeList — tabela/cards de nós com status, capacidade e heartbeat.
 * Fonte: docs/frontend/web/04-components.md (NodeList)
 */
'use client';

import { HardDrive, Loader2 } from 'lucide-react';
import { NodeStatusBadge } from './NodeStatusBadge';
import type { NodeDTO } from '../types/node.types';
import { formatBytes } from '@/lib/format';

interface NodeListProps {
  nodes: NodeDTO[];
  isLoading: boolean;
  onNodeClick: (node: NodeDTO) => void;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Nunca';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

const NODE_TYPE_LABELS: Record<string, string> = {
  local: 'Local',
  s3: 'AWS S3',
  r2: 'Cloudflare R2',
  b2: 'Backblaze B2',
  vps: 'VPS',
};

export function NodeList({ nodes, isLoading, onNodeClick }: NodeListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-[var(--muted)] rounded-[var(--radius)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-16">
        <HardDrive size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Nenhum nó registrado</h2>
        <p className="text-[var(--muted-foreground)] mt-1">
          Adicione o primeiro nó de armazenamento para começar a distribuir dados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => {
        const usagePercent = node.totalCapacity > 0
          ? Math.round((node.usedCapacity / node.totalCapacity) * 100)
          : 0;

        return (
          <div
            key={node.id}
            onClick={() => onNodeClick(node)}
            className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 cursor-pointer hover:border-[var(--primary)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive size={20} className="text-[var(--muted-foreground)]" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--foreground)]">{node.name}</span>
                    <NodeStatusBadge status={node.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mt-0.5">
                    <span>{NODE_TYPE_LABELS[node.type] ?? node.type}</span>
                    <span>{node.chunksStored} chunks</span>
                    <span>Heartbeat: {formatRelativeTime(node.lastHeartbeat)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="text-[var(--foreground)] font-medium">
                  {formatBytes(node.usedCapacity)} / {formatBytes(node.totalCapacity)}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">{usagePercent}% usado</div>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mt-3 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent > 90
                    ? 'bg-[var(--destructive)]'
                    : usagePercent > 70
                      ? 'bg-[var(--warning)]'
                      : 'bg-[var(--success)]'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            {/* Drain progress */}
            {node.status === 'draining' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--info)]">
                <Loader2 size={12} className="animate-spin" />
                <span>Migrando chunks...</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
