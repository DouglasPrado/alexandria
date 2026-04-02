/**
 * NodesPage — lista e gerenciamento de nós de armazenamento.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/nodes)
 * Design: Stitch — Bento metrics + editorial node cards + capacity bar
 *
 * Rota: /dashboard/nodes
 * Auth: JWT (admin + member)
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Scale,
  HardDrive,
} from 'lucide-react';
import {
  DedupStatsCard,
  AddNodeDialog,
  useNodes,
  useRebalance,
  type NodeDTO,
} from '@/features/nodes';
import { useAuthStore } from '@/store/auth-store';
import { formatBytes } from '@/lib/format';
import { NodeCardList } from '@/features/nodes/components/NodeCardList';

export default function NodesPage() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.member?.role) === 'admin';
  const { data: nodes, isLoading } = useNodes();
  const rebalance = useRebalance();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [rebalanceResult, setRebalanceResult] = useState<string | null>(null);

  function handleNodeClick(node: NodeDTO) {
    router.push(`/dashboard/nodes/${node.id}`);
  }

  async function handleRebalance() {
    const result = await rebalance.mutateAsync();
    setRebalanceResult(
      `Rebalanceamento concluído: ${result.chunksRelocated} relocados, ${result.chunksSkipped} ok, ${result.chunksFailed} falhas`,
    );
    setTimeout(() => setRebalanceResult(null), 5000);
  }

  const activeNodes = nodes?.filter((n) => n.status !== 'disconnected') ?? [];
  const onlineCount = nodes?.filter((n) => n.status === 'online').length ?? 0;
  const offlineCount = nodes?.filter((n) => n.status === 'lost' || n.status === 'suspect').length ?? 0;
  const totalCapacity = activeNodes.reduce((s, n) => s + n.totalCapacity, 0);
  const usedCapacity = activeNodes.reduce((s, n) => s + n.usedCapacity, 0);
  const totalChunks = activeNodes.reduce((s, n) => s + n.chunksStored, 0);
  const usedPct = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2
            className="text-4xl font-extrabold font-display tracking-tight mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            Nós de Armazenamento
          </h2>
          <p className="max-w-md" style={{ color: 'var(--muted-foreground)' }}>
            Gerencie a infraestrutura distribuída do seu arquivo digital. Monitore integridade e rebalanceie chunks em tempo real.
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={handleRebalance}
              disabled={rebalance.isPending}
              className="flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'rgba(218, 226, 253, 0.2)',
                color: 'var(--primary-container)',
                border: '1px solid rgba(198, 198, 205, 0.15)',
              }}
            >
              <Scale size={18} className={rebalance.isPending ? 'animate-spin' : ''} />
              {rebalance.isPending ? 'Rebalanceando...' : 'Rebalancear'}
            </button>
          )}
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg text-white transition-all active:scale-95 shadow-sm hover:opacity-90"
            style={{ backgroundColor: 'var(--primary-container)' }}
          >
            <Plus size={18} />
            Adicionar Nó
          </button>
        </div>
      </div>

      {rebalanceResult && (
        <div
          className="px-4 py-3 rounded-lg text-sm mb-6"
          style={{
            backgroundColor: 'rgba(111, 251, 190, 0.15)',
            color: '#005236',
          }}
        >
          {rebalanceResult}
        </div>
      )}

      {/* Bento Metrics */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <BentoCard
            label="Nós online"
            value={String(onlineCount)}
            suffix={`/${activeNodes.length}`}
            stripeColor="var(--tertiary-fixed)"
          />
          <BentoCard
            label="Nós offline"
            value={String(offlineCount)}
            stripeColor={offlineCount > 0 ? 'var(--destructive)' : 'var(--outline-variant)'}
            stripeOpacity={offlineCount > 0 ? 1 : 0.3}
          />
          <BentoCard
            label="Espaço total"
            value={formatBytes(totalCapacity)}
            stripeColor="var(--surface-tint)"
          />
          <BentoCard
            label="Chunks armazenados"
            value={totalChunks.toLocaleString('pt-BR')}
            stripeColor="var(--primary-fixed)"
          />
        </div>
      )}

      {/* Cluster Capacity Bar */}
      {!isLoading && totalCapacity > 0 && (
        <div
          className="p-8 rounded-2xl mb-10"
          style={{
            backgroundColor: 'var(--surface-container-low)',
            border: '1px solid rgba(198, 198, 205, 0.1)',
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <HardDrive size={20} style={{ color: 'var(--tertiary-fixed-dim)' }} />
              <h3 className="font-bold text-lg font-display">Capacidade do Cluster</h3>
            </div>
            <span className="font-display font-extrabold text-2xl">
              {usedPct}%{' '}
              <span className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>
                em uso
              </span>
            </span>
          </div>
          <div
            className="w-full h-4 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--surface-container-highest)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usedPct}%`,
                background: 'linear-gradient(to right, var(--primary-container), var(--surface-tint))',
              }}
            />
          </div>
          <div
            className="flex justify-between mt-4 text-[11px] font-medium uppercase tracking-wide"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span>0 GB Alocado</span>
            <span>{formatBytes(usedCapacity)} Utilizado</span>
            <span>{formatBytes(totalCapacity)} Capacidade</span>
          </div>
        </div>
      )}

      {/* Dedup Stats */}
      <DedupStatsCard />

      {/* Node Cards */}
      <NodeCardList
        nodes={nodes ?? []}
        isLoading={isLoading}
        onNodeClick={handleNodeClick}
      />

      {/* Add Node Dialog */}
      <AddNodeDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />

      {/* Floating cluster health (glassmorphism) */}
      {!isLoading && nodes && nodes.length > 0 && (
        <div
          className="fixed bottom-8 right-8 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
          }}
        >
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--tertiary-fixed)' }}
          />
          <div className="pr-4">
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Cluster Health
            </p>
            <p className="text-xs font-semibold">
              Integridade {offlineCount === 0 ? '100%' : `${Math.round((onlineCount / activeNodes.length) * 100)}%`} Nominal
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function BentoCard({
  label,
  value,
  suffix,
  stripeColor,
  stripeOpacity = 1,
}: {
  label: string;
  value: string;
  suffix?: string;
  stripeColor: string;
  stripeOpacity?: number;
}) {
  return (
    <div
      className="p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface-container-low)' }}
    >
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: stripeColor, opacity: stripeOpacity }}
      />
      <span
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold font-display">{value}</span>
        {suffix && (
          <span className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
