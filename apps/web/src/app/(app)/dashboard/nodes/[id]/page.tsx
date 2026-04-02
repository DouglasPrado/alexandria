/**
 * NodeDetailPage — detalhe do nó com status, capacidade e ação de drain.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/nodes/:id)
 * Design: Stitch — "Detalhes do Nó - Alexandria Premium"
 * Sem Cluster Health Analytics (não disponível)
 *
 * Rota: /dashboard/nodes/[id]
 * Auth: JWT (admin + member)
 */
'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  HardDrive,
  Loader2,
  Unplug,
  Database,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  DisconnectConfirmDialog,
  useNodeDetail,
  TierBadge,
} from '@/features/nodes';
import { useAuthStore } from '@/store/auth-store';
import { formatBytes } from '@/lib/format';

const NODE_TYPE_LABELS: Record<string, string> = {
  local: 'Local',
  s3: 'AWS S3',
  r2: 'Cloudflare R2',
  b2: 'Backblaze B2',
  vps: 'VPS',
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  online: { bg: 'rgba(111, 251, 190, 0.2)', text: '#005236', label: 'ONLINE' },
  suspect: { bg: 'rgba(232, 163, 23, 0.2)', text: '#7a5900', label: 'SUSPECT' },
  lost: { bg: 'rgba(186, 26, 26, 0.15)', text: '#ba1a1a', label: 'LOST' },
  draining: { bg: 'rgba(64, 95, 145, 0.15)', text: '#405f91', label: 'DRAINING' },
  disconnected: { bg: 'rgba(198, 198, 205, 0.2)', text: '#76777d', label: 'DISCONNECTED' },
};

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

export default function NodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: node, isLoading } = useNodeDetail(id);
  const [showDisconnect, setShowDisconnect] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      </div>
    );
  }

  if (!node) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--muted-foreground)' }}>Nó não encontrado.</p>
        <button
          onClick={() => router.push('/dashboard/nodes')}
          className="mt-4 text-sm hover:underline"
          style={{ color: 'var(--primary-container)' }}
        >
          Voltar para a lista
        </button>
      </div>
    );
  }

  const usagePct = node.totalCapacity > 0
    ? Math.round((node.usedCapacity / node.totalCapacity) * 100)
    : 0;
  const isAdmin = useAuthStore((s) => s.member?.role) === 'admin';
  const canDisconnect = isAdmin && node.status !== 'disconnected';
  const providerLabel = NODE_TYPE_LABELS[node.type] ?? node.type;
  const statusStyle = STATUS_COLORS[node.status] ?? STATUS_COLORS.disconnected;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        <button
          onClick={() => router.push('/dashboard/nodes')}
          className="hover:underline transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Nodes
        </button>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--foreground)' }} className="font-medium">{providerLabel}</span>
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push('/dashboard/nodes')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <ArrowLeft size={14} />
        Voltar
      </button>

      {/* Header — provider + status + disconnect */}
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-5">
          {/* Provider icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-container-low)' }}
          >
            <HardDrive size={32} style={{ color: 'var(--primary-container)' }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold font-display tracking-tight" style={{ color: 'var(--foreground)' }}>
                {providerLabel}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: statusStyle!.bg, color: statusStyle!.text }}
              >
                {statusStyle!.label}
              </span>
              <TierBadge tier={node.tier ?? 'warm'} />
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Node ID: {node.id}
            </p>
          </div>
        </div>

        {canDisconnect && (
          <button
            onClick={() => setShowDisconnect(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
            style={{
              backgroundColor: 'rgba(186, 26, 26, 0.08)',
              color: 'var(--destructive)',
            }}
          >
            <Unplug size={16} />
            Desconectar
          </button>
        )}
      </div>

      {/* Stat cards — 3 cols, tonal layering, no borders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Capacity */}
        <div
          className="p-8 rounded-2xl"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest block mb-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Capacity
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold font-display">{formatBytes(node.usedCapacity)}</span>
            <span className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
              / {formatBytes(node.totalCapacity)}
            </span>
          </div>
          <div
            className="h-2.5 rounded-full overflow-hidden mt-4"
            style={{ backgroundColor: 'var(--surface-container-highest)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usagePct}%`,
                background: usagePct > 80
                  ? 'var(--destructive)'
                  : 'linear-gradient(to right, var(--primary-container), var(--surface-tint))',
              }}
            />
          </div>
          <span
            className="text-xs mt-2 block"
            style={{ color: usagePct > 80 ? 'var(--destructive)' : 'var(--success)' }}
          >
            {usagePct}% utilizado
          </span>
        </div>

        {/* Stored Data */}
        <div
          className="p-8 rounded-2xl"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest block mb-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Stored Data
          </span>
          <div className="flex items-center gap-3">
            <Database size={20} style={{ color: 'var(--secondary)' }} />
            <span className="text-4xl font-extrabold font-display">
              {node.chunksStored.toLocaleString('pt-BR')}
            </span>
          </div>
          <span
            className="text-sm mt-2 block"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Chunks armazenados
          </span>
        </div>

        {/* Status Update */}
        <div
          className="p-8 rounded-2xl"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest block mb-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Status Update
          </span>
          <div className="flex items-center gap-3">
            <Clock size={20} style={{ color: 'var(--secondary)' }} />
            <span className="text-4xl font-extrabold font-display">
              {formatRelativeTime(node.lastHeartbeat)}
            </span>
          </div>
          <span
            className="text-sm mt-1 block"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Último heartbeat
          </span>
          {node.lastHeartbeat && (
            <span
              className="text-xs mt-1 block"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {formatDate(node.lastHeartbeat)}
            </span>
          )}
        </div>
      </div>

      {/* Node details — additional info */}
      <div
        className="p-8 rounded-2xl mb-10"
        style={{
          backgroundColor: 'var(--surface-container-lowest)',
          boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.04)',
        }}
      >
        <h3 className="font-display font-bold text-lg mb-6">Informações do Nó</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6">
          <DetailField label="Nome" value={node.name} />
          <DetailField label="Tipo" value={providerLabel} />
          <DetailField label="Tier" value={(node.tier ?? 'warm').toUpperCase()} />
          <DetailField label="Status" value={node.status.toUpperCase()} />
          <DetailField label="Dono" value={node.owner?.name ?? '—'} />
          <DetailField label="Registrado em" value={formatDate(node.createdAt)} />
          <DetailField label="ID" value={node.id.slice(0, 16) + '...'} mono />
        </div>
      </div>

      {/* Drain progress */}
      {node.status === 'draining' && (
        <div
          className="p-6 rounded-2xl flex items-center gap-4 mb-10"
          style={{
            backgroundColor: 'rgba(64, 95, 145, 0.08)',
          }}
        >
          <Loader2 size={20} className="animate-spin shrink-0" style={{ color: 'var(--info)' }} />
          <div>
            <p className="font-medium font-display" style={{ color: 'var(--foreground)' }}>
              Drain em andamento
            </p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
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

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span
        className="block text-[10px] uppercase tracking-[0.15em] font-bold mb-1"
        style={{ color: 'rgba(69, 70, 77, 0.6)' }}
      >
        {label}
      </span>
      <span
        className={`font-display font-bold ${mono ? 'font-mono text-xs' : ''}`}
        style={{ color: 'var(--foreground)' }}
      >
        {value}
      </span>
    </div>
  );
}
