/**
 * NodeCardList — lista editorial de nós com status stripe, logo do provedor e specs.
 * Fonte: docs/frontend/web/04-components.md (NodeList)
 * Design: Stitch — card largo, stripe esquerdo, provedor grayscale→color, grid 4 specs
 */
'use client';

import {
  HardDrive,
  Loader2,
  MoreVertical,
  Thermometer,
  Database,
  Clock,
  Cpu,
  User,
} from 'lucide-react';
import type { NodeDTO } from '../types/node.types';
import { formatBytes } from '@/lib/format';

interface NodeCardListProps {
  nodes: NodeDTO[];
  isLoading: boolean;
  onNodeClick: (node: NodeDTO) => void;
}

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

const TIER_LABELS: Record<string, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
};

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

export function NodeCardList({ nodes, isLoading, onNodeClick }: NodeCardListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl animate-pulse"
            style={{ backgroundColor: 'var(--surface-container-low)' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold font-display">Nós Ativos</h3>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Ultima sincronização: 2min atrás
        </span>
      </div>

      {nodes.length === 0 ? (
        <EmptyNodeState />
      ) : (
        nodes.map((node) => (
          <NodeCard key={node.id} node={node} onClick={() => onNodeClick(node)} />
        ))
      )}

      {/* Expansion placeholder */}
      {nodes.length > 0 && (
        <div
          className="mt-8 border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center opacity-60"
          style={{ borderColor: 'rgba(198, 198, 205, 0.2)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--surface-container-low)' }}
          >
            <Cpu size={28} style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <h4 className="font-bold text-lg mb-1 font-display">Pronto para expansão</h4>
          <p className="text-sm max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
            Adicione novos provedores de armazenamento para aumentar a redundância do seu cluster.
          </p>
        </div>
      )}
    </div>
  );
}

function NodeCard({ node, onClick }: { node: NodeDTO; onClick: () => void }) {
  const isOnline = node.status === 'online';
  const isDraining = node.status === 'draining';
  const stripeColor = isOnline ? 'var(--tertiary-fixed)' : 'var(--destructive)';
  const tierLabel = TIER_LABELS[node.tier] ?? node.tier;
  const providerLabel = NODE_TYPE_LABELS[node.type] ?? node.type;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-8 flex items-center gap-10 transition-all cursor-pointer group"
      style={{
        backgroundColor: 'var(--surface-container-lowest)',
        border: '1px solid rgba(198, 198, 205, 0.05)',
      }}
    >
      {/* Status Stripe */}
      <div
        className="w-1.5 h-16 rounded-full shrink-0"
        style={{ backgroundColor: stripeColor }}
      />

      {/* Provider brand */}
      <div className="flex items-center gap-6 w-1/4 shrink-0">
        <div
          className="w-14 h-14 flex items-center justify-center rounded-xl overflow-hidden grayscale group-hover:grayscale-0 transition-all"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          <HardDrive size={28} style={{ color: 'var(--muted-foreground)' }} />
        </div>
        <div>
          <h4 className="font-bold text-lg leading-tight font-display">{providerLabel}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isOnline ? 'var(--tertiary-fixed)' : 'var(--destructive)' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-tighter"
              style={{ color: isOnline ? 'var(--success)' : 'var(--destructive)' }}
            >
              {node.status === 'draining' ? 'Draining' : node.status}
            </span>
          </div>
        </div>
      </div>

      {/* Technical Specs — grid 5 cols */}
      <div className="grid grid-cols-5 flex-1 gap-6">
        <SpecCell
          icon={User}
          label="Dono"
          value={node.owner?.name ?? '—'}
        />
        <SpecCell
          icon={Thermometer}
          label="Temperatura"
          value={tierLabel}
          bold
        />
        <SpecCell
          icon={Database}
          label="Chunks"
          value={node.chunksStored.toLocaleString('pt-BR')}
        />
        <SpecCell
          icon={Clock}
          label="Heartbeat"
          value={formatRelativeTime(node.lastHeartbeat)}
        />
        <SpecCell
          icon={HardDrive}
          label="Uso"
          value={`${formatBytes(node.usedCapacity)}`}
          suffix={`/ ${formatBytes(node.totalCapacity)}`}
          bold
        />
      </div>

      {/* Action */}
      <button
        onClick={(e) => { e.stopPropagation(); }}
        className="p-2 rounded-lg transition-colors shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <MoreVertical size={18} />
      </button>

      {/* Drain indicator */}
      {isDraining && (
        <div className="absolute bottom-2 left-20 flex items-center gap-2 text-xs" style={{ color: 'var(--info)' }}>
          <Loader2 size={12} className="animate-spin" />
          <span>Migrando chunks...</span>
        </div>
      )}
    </div>
  );
}

function SpecCell({
  icon: Icon,
  label,
  value,
  suffix,
  bold,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  suffix?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span
        className="text-[10px] uppercase tracking-widest mb-1"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <Icon size={16} style={{ color: 'var(--secondary)' }} />
        <span className={`text-lg ${bold ? 'font-display font-bold' : 'font-medium'}`}>
          {value}
          {suffix && (
            <span className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>
              {' '}{suffix}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function EmptyNodeState() {
  return (
    <div className="text-center py-16">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: 'var(--surface-container-low)' }}
      >
        <HardDrive size={28} style={{ color: 'var(--muted-foreground)' }} />
      </div>
      <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--foreground)' }}>
        Nenhum nó registrado
      </h2>
      <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Adicione o primeiro nó de armazenamento para começar a distribuir dados.
      </p>
    </div>
  );
}
