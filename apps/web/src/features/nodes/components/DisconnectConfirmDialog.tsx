/**
 * DisconnectConfirmDialog — confirmação para drain + desconexão de nó.
 * Fonte: docs/frontend/web/04-components.md (DisconnectConfirmDialog)
 * Design: Alexandria Protocol — rounded-3xl, tonal layering, no borders
 */
'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X, HardDrive, Database } from 'lucide-react';
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(19, 27, 46, 0.4)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-container-lowest)',
          boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.12)',
        }}
      >
        {/* Header */}
        <div className="p-6 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(232, 163, 23, 0.12)' }}
            >
              <AlertTriangle size={22} style={{ color: 'var(--warning)' }} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg" style={{ color: 'var(--foreground)' }}>
                Desconectar nó
              </h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {isDraining ? 'Drain em andamento...' : 'Os chunks serão migrados antes da remoção.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Node identity */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ backgroundColor: 'var(--surface-container-low)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--surface-container-lowest)' }}
            >
              <HardDrive size={18} style={{ color: 'var(--primary-container)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                {node.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {node.type.toUpperCase()} · {node.status.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Impact — grid 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-4 rounded-2xl"
              style={{ backgroundColor: 'var(--surface-container-low)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database size={14} style={{ color: 'var(--secondary)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Chunks
                </span>
              </div>
              <span className="text-2xl font-display font-extrabold" style={{ color: 'var(--foreground)' }}>
                {node.chunksStored.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs block mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                a serem migrados
              </span>
            </div>
            <div
              className="p-4 rounded-2xl"
              style={{ backgroundColor: 'var(--surface-container-low)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <HardDrive size={14} style={{ color: 'var(--secondary)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Espaço
                </span>
              </div>
              <span className="text-2xl font-display font-extrabold" style={{ color: 'var(--foreground)' }}>
                {formatBytes(node.usedCapacity)}
              </span>
              <span className="text-xs block mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                utilizado
              </span>
            </div>
          </div>

          {/* Warning message */}
          {!isDraining && !isDisconnected && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl text-sm"
              style={{ backgroundColor: 'rgba(232, 163, 23, 0.08)', color: '#7a5900' }}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Ao desconectar, todos os chunks deste nó serão migrados para outros nós antes da remoção.
                Este processo pode levar horas dependendo da quantidade de dados.
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-xl p-4 text-sm"
              style={{ backgroundColor: 'rgba(186, 26, 26, 0.08)', color: 'var(--destructive)' }}
            >
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-display font-bold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--surface-container-low)',
                color: 'var(--foreground)',
              }}
            >
              Cancelar
            </button>

            {isDisconnected ? (
              <button
                onClick={handleRemove}
                disabled={removeNode.isPending}
                className="flex-1 py-3.5 rounded-xl font-display font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'var(--destructive)' }}
              >
                {removeNode.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Removendo...
                  </span>
                ) : 'Remover nó'}
              </button>
            ) : isDraining ? (
              <button
                disabled
                className="flex-1 py-3.5 rounded-xl font-display font-bold text-sm text-white opacity-70"
                style={{ backgroundColor: 'var(--info)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Migrando chunks...
                </span>
              </button>
            ) : (
              <button
                onClick={handleDrain}
                disabled={drainNode.isPending}
                className="flex-1 py-3.5 rounded-xl font-display font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--destructive)',
                  color: 'white',
                }}
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
    </div>
  );
}
