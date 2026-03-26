'use client';

import { useRef } from 'react';
import { History, Upload, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useFileVersions, useCreateVersion } from '../hooks/useFileVersions';
import type { FileVersionDTO } from '../types/file.types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusIcon({ status }: { status: FileVersionDTO['status'] }) {
  if (status === 'ready') return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === 'processing') return <Clock size={14} className="text-amber-500 animate-pulse" />;
  return <AlertCircle size={14} className="text-[var(--destructive)]" />;
}

/**
 * VersionHistoryPanel — painel de histórico de versões de um arquivo.
 * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Versionamento)
 */
export function VersionHistoryPanel({ fileId, canUpload }: { fileId: string; canUpload: boolean }) {
  const { data: versions, isLoading } = useFileVersions(fileId);
  const createVersion = useCreateVersion(fileId);
  const inputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return null;
  if (!versions || versions.length <= 1) return null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-[var(--muted-foreground)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">
            Histórico de versões ({versions.length})
          </span>
        </div>
        {canUpload && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={createVersion.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Upload size={12} />
              {createVersion.isPending ? 'Enviando...' : 'Nova versão'}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) createVersion.mutate(file);
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>

      <ul className="space-y-2">
        {[...versions].reverse().map((v) => (
          <li key={v.id} className="flex items-center gap-3 text-sm">
            <StatusIcon status={v.status} />
            <span className="font-medium text-[var(--foreground)] w-6 shrink-0">v{v.versionNumber}</span>
            <span className="flex-1 truncate text-[var(--muted-foreground)]">{v.originalName}</span>
            <span className="text-xs text-[var(--muted-foreground)] shrink-0">{formatBytes(v.originalSize)}</span>
            <span className="text-xs text-[var(--muted-foreground)] shrink-0">{formatDate(v.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
