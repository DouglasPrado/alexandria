/**
 * DisconnectConfirmDialog — confirmação para drain + desconexão de nó.
 * Fonte: docs/frontend/web/04-components.md (DisconnectConfirmDialog)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 5: Desconectar nó)
 */
'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useDrainNode, useRemoveNode } from '../hooks/useNodeMutations';
import type { NodeDTO } from '../types/node.types';
import { formatBytes } from '@/lib/format';

interface DisconnectConfirmDialogProps {
  node: NodeDTO;
  open: boolean;
  onClose: () => void;
}

export function DisconnectConfirmDialog({ node, open, onClose }: DisconnectConfirmDialogProps) {
  const drainNode = useDrainNode();
  const removeNode = useRemoveNode();
  const [error, setError] = useState('');

  if (!open) return null;

  const isDraining = node.status === 'draining';
  const isDisconnected = node.status === 'disconnected';

  async function handleDrain() {
    setError('');
    try {
      await drainNode.mutateAsync(node.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar drain');
    }
  }

  async function handleRemove() {
    setError('');
    try {
      await removeNode.mutateAsync(node.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover nó');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] w-full max-w-md shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--warning)]/10 rounded-full">
            <AlertTriangle size={24} className="text-[var(--warning)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Desconectar &ldquo;{node.name}&rdquo;</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isDraining ? 'Drain em andamento...' : 'Os chunks serão migrados antes da remoção.'}
            </p>
          </div>
        </div>

        {/* Impact info */}
        <div className="bg-[var(--secondary)] rounded-[var(--radius)] p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Chunks armazenados</span>
            <span className="text-[var(--foreground)] font-medium">{node.chunksStored}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Espaço utilizado</span>
            <span className="text-[var(--foreground)] font-medium">{formatBytes(node.usedCapacity)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-[var(--radius)] p-3 text-sm text-[var(--destructive)]">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-[var(--foreground)] font-medium hover:bg-[var(--secondary)] transition-colors text-sm"
          >
            Cancelar
          </button>

          {isDisconnected ? (
            <button
              onClick={handleRemove}
              disabled={removeNode.isPending}
              className="flex-1 py-2.5 bg-[var(--destructive)] text-white rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
            >
              {removeNode.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Removendo...
                </span>
              ) : 'Remover nó'}
            </button>
          ) : isDraining ? (
            <button disabled className="flex-1 py-2.5 bg-[var(--info)] text-white rounded-[var(--radius)] font-medium opacity-70 text-sm">
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Migrando chunks...
              </span>
            </button>
          ) : (
            <button
              onClick={handleDrain}
              disabled={drainNode.isPending}
              className="flex-1 py-2.5 bg-[var(--warning)] text-[var(--warning-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
            >
              {drainNode.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Iniciando...
                </span>
              ) : 'Iniciar drain'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
