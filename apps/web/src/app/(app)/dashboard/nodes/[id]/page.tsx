/**
 * NodeDetailPage — detalhe do nó com status, capacidade e ação de drain.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/nodes/:id)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 5)
 *
 * Rota: /dashboard/nodes/[id]
 * Auth: JWT + admin
 */
'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HardDrive, Loader2, Unplug } from 'lucide-react';
import {
  NodeStatusBadge,
  DisconnectConfirmDialog,
  useNodeDetail,
} from '@/features/nodes';
import { formatBytes } from '@/lib/format';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

export default function NodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: node, isLoading } = useNodeDetail(id);
  const [showDisconnect, setShowDisconnect] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="text-[var(--muted-foreground)] animate-spin" />
      </div>
    );
  }

  if (!node) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--muted-foreground)]">Nó não encontrado.</p>
        <button onClick={() => router.push('/dashboard/nodes')} className="mt-4 text-sm text-[var(--primary)] hover:underline">
          Voltar para a lista
        </button>
      </div>
    );
  }

  const usagePercent = node.totalCapacity > 0
    ? Math.round((node.usedCapacity / node.totalCapacity) * 100)
    : 0;

  const canDisconnect = node.status !== 'disconnected';

  return (
    <div className="p-6 space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.push('/dashboard/nodes')}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDrive size={28} className="text-[var(--muted-foreground)]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{node.name}</h1>
              <NodeStatusBadge status={node.status} />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {NODE_TYPE_LABELS[node.type] ?? node.type} · Registrado em {formatDate(node.createdAt)}
            </p>
          </div>
        </div>

        {canDisconnect && (
          <button
            onClick={() => setShowDisconnect(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--destructive)] text-[var(--destructive)] rounded-[var(--radius)] font-medium hover:bg-[var(--destructive)]/10 transition-colors text-sm"
          >
            <Unplug size={16} />
            Desconectar
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Capacidade</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {formatBytes(node.usedCapacity)} / {formatBytes(node.totalCapacity)}
          </div>
          <div className="mt-3 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
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
          <div className="text-xs text-[var(--muted-foreground)] mt-1">{usagePercent}% utilizado</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Chunks armazenados</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {node.chunksStored.toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Último heartbeat</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {formatRelativeTime(node.lastHeartbeat)}
          </div>
          {node.lastHeartbeat && (
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {formatDate(node.lastHeartbeat)}
            </div>
          )}
        </div>
      </div>

      {/* Drain progress */}
      {node.status === 'draining' && (
        <div className="bg-[var(--info)]/10 border border-[var(--info)] rounded-[var(--radius)] p-4 flex items-center gap-3">
          <Loader2 size={20} className="text-[var(--info)] animate-spin flex-shrink-0" />
          <div>
            <p className="font-medium text-[var(--foreground)]">Drain em andamento</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Os chunks estão sendo migrados para outros nós. Este processo pode levar algumas horas.
            </p>
          </div>
        </div>
      )}

      {/* Disconnect dialog */}
      {showDisconnect && (
        <DisconnectConfirmDialog
          node={node}
          open={showDisconnect}
          onClose={() => setShowDisconnect(false)}
        />
      )}
    </div>
  );
}
