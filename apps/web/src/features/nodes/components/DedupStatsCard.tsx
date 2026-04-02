/**
 * DedupStatsCard — exibe economias de deduplicação de chunks.
 * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Deduplicação global)
 * Design: Alexandria Protocol — rounded-2xl, tonal layering, no borders
 */
'use client';

import { Layers, Database, HardDrive, Percent } from 'lucide-react';
import { useDedupStats } from '../hooks/useDedupStats';
import { formatBytes } from '@/lib/format';

export function DedupStatsCard() {
  const { data, isLoading } = useDedupStats();

  if (isLoading) return null;
  if (!data || data.totalChunks === 0) return null;

  return (
    <div
      className="p-8 rounded-2xl mb-10"
      style={{
        backgroundColor: 'var(--surface-container-lowest)',
        boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.04)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          <Layers size={18} style={{ color: 'var(--primary-container)' }} />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Deduplicação de Chunks</h3>
          {data.bytesSaved > 0 && (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {formatBytes(data.bytesStored)} armazenados vs {formatBytes(data.bytesLogical)} lógicos
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCell
          icon={Database}
          label="Chunks únicos"
          value={data.totalChunks.toLocaleString('pt-BR')}
        />
        <StatCell
          icon={Layers}
          label="Referências totais"
          value={data.totalReferences.toLocaleString('pt-BR')}
        />
        <StatCell
          icon={HardDrive}
          label="Espaço economizado"
          value={formatBytes(data.bytesSaved)}
          highlight={data.bytesSaved > 0}
        />
        <StatCell
          icon={Percent}
          label="Ratio dedup"
          value={`${data.dedupRatio}%`}
          highlight={data.dedupRatio > 0}
        />
      </div>
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{ backgroundColor: 'var(--surface-container-low)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: 'var(--secondary)' }} />
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-2xl font-display font-extrabold"
        style={{ color: highlight ? 'var(--success)' : 'var(--foreground)' }}
      >
        {value}
      </span>
    </div>
  );
}
