/**
 * UploadQueue — lista flutuante (bottom-right) com status de cada upload.
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 2)
 * Fonte: docs/frontend/web/04-components.md (UploadQueue, UploadQueueItem)
 */
'use client';

import { useUploadStore } from '@/store/upload-store';
import { X, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function UploadQueue() {
  const items = useUploadStore((s) => s.items);
  const removeItem = useUploadStore((s) => s.removeItem);
  const clearDone = useUploadStore((s) => s.clearDone);
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  const doneCount = items.filter((i) => i.status === 'done').length;
  const activeCount = items.filter((i) => i.status === 'uploading' || i.status === 'pending').length;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[var(--secondary)] cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-sm font-medium text-[var(--foreground)]">
          {activeCount > 0
            ? `Enviando ${activeCount} arquivo${activeCount > 1 ? 's' : ''}...`
            : `${doneCount} upload${doneCount > 1 ? 's' : ''} concluído${doneCount > 1 ? 's' : ''}`}
        </span>
        <div className="flex items-center gap-1">
          {doneCount > 0 && doneCount === items.length && (
            <button
              onClick={(e) => { e.stopPropagation(); clearDone(); }}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Limpar
            </button>
          )}
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="max-h-60 overflow-y-auto divide-y divide-[var(--border)]">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-shrink-0">
                {item.status === 'done' && <CheckCircle2 size={16} className="text-[var(--success)]" />}
                {item.status === 'error' && <AlertCircle size={16} className="text-[var(--destructive)]" />}
                {(item.status === 'uploading' || item.status === 'pending') && (
                  <Loader2 size={16} className="text-[var(--primary)] animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--foreground)] truncate">{item.file.name}</p>
                {item.status === 'error' && (
                  <p className="text-xs text-[var(--destructive)]">{item.error || 'Falha no upload'}</p>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0"
                aria-label={`Remover ${item.file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
