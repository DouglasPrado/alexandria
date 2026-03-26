/**
 * NodesPage — lista e gerenciamento de nós de armazenamento.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/nodes)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 5: Monitoramento e Gestão de Nós)
 *
 * Rota: /dashboard/nodes
 * Auth: JWT + admin
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw } from 'lucide-react';
import {
  ClusterHealthSummary,
  NodeList,
  AddNodeDialog,
  useNodes,
  useRebalance,
  type NodeDTO,
} from '@/features/nodes';

export default function NodesPage() {
  const router = useRouter();
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Nós de Armazenamento</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRebalance}
            disabled={rebalance.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-[var(--radius)] font-medium hover:bg-[var(--muted)] transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={rebalance.isPending ? 'animate-spin' : ''} />
            {rebalance.isPending ? 'Rebalanceando...' : 'Rebalancear'}
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 transition-opacity text-sm"
          >
            <Plus size={16} />
            Adicionar Nó
          </button>
        </div>
      </div>

      {rebalanceResult && (
        <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {rebalanceResult}
        </div>
      )}

      {/* Health Summary */}
      {nodes && nodes.length > 0 && <ClusterHealthSummary nodes={nodes} />}

      {/* Node List */}
      <NodeList
        nodes={nodes ?? []}
        isLoading={isLoading}
        onNodeClick={handleNodeClick}
      />

      {/* Add Node Dialog */}
      <AddNodeDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />
    </div>
  );
}
