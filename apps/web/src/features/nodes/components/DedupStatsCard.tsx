'use client';

import { Layers } from 'lucide-react';
import { useDedupStats } from '../hooks/useDedupStats';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * DedupStatsCard — exibe economias de deduplicação de chunks.
 * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Deduplicação global)
 */
export function DedupStatsCard() {
  const { data, isLoading } = useDedupStats();

  if (isLoading) return null;
  if (!data || data.totalChunks === 0) return null;

  return (
    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-3">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-[var(--muted-foreground)]" />
        <span className="text-sm font-medium text-[var(--foreground)]">Deduplicação de Chunks</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Chunks únicos" value={data.totalChunks.toLocaleString('pt-BR')} />
        <Stat label="Referências totais" value={data.totalReferences.toLocaleString('pt-BR')} />
        <Stat label="Espaço economizado" value={formatBytes(data.bytesSaved)} highlight={data.bytesSaved > 0} />
        <Stat label="Ratio dedup" value={`${data.dedupRatio}%`} highlight={data.dedupRatio > 0} />
      </div>

      {data.bytesSaved > 0 && (
        <p className="text-xs text-[var(--muted-foreground)]">
          {formatBytes(data.bytesStored)} armazenados fisicamente vs {formatBytes(data.bytesLogical)} lógicos
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-emerald-600' : 'text-[var(--foreground)]'}`}>
        {value}
      </p>
    </div>
  );
}
