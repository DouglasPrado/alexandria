/**
 * TimelineView — agrupa arquivos por mês/ano em ordem cronológica decrescente.
 * Usa metadata.takenAt (EXIF) quando disponível, fallback para createdAt.
 * Fonte: docs/frontend/web/04-components.md (TimelineView)
 * Fonte: docs/blueprint/08-use_cases.md (UC-010)
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import type { FileDTO } from '../types/file.types';
import { FileIcon } from './FileIcon';

interface TimelineViewProps {
  files: FileDTO[];
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNext: boolean;
  onLoadMore: () => void;
  onFileClick: (file: FileDTO) => void;
}

/** Retorna a data relevante do arquivo: takenAt (EXIF) se disponível, senão createdAt */
function fileDate(file: FileDTO): Date {
  const iso = file.metadata?.takenAt ?? file.createdAt;
  return new Date(iso);
}

/** Chave de agrupamento: "YYYY-MM" */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Formata cabeçalho em português: "Janeiro 2025" */
function formatMonthHeader(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  // Capitaliza primeira letra
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Agrupa e ordena: meses mais recentes primeiro */
function groupByMonth(files: FileDTO[]): { key: string; label: string; files: FileDTO[] }[] {
  const map = new Map<string, FileDTO[]>();

  for (const file of files) {
    const key = monthKey(fileDate(file));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(file);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // mais recente primeiro
    .map(([key, groupFiles]) => ({
      key,
      label: formatMonthHeader(key),
      files: groupFiles,
    }));
}

export function TimelineView({
  files,
  hasMore,
  isLoading,
  isFetchingNext,
  onLoadMore,
  onFileClick,
}: TimelineViewProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetchingNext) onLoadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingNext, onLoadMore]);

  const handleKeyDown = useCallback(
    (file: FileDTO, e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onFileClick(file);
      }
    },
    [onFileClick],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="h-5 w-32 bg-[var(--muted)] rounded animate-pulse mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="aspect-square bg-[var(--muted)] rounded-[var(--radius)] animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-20">
        <ImageIcon size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Nenhum arquivo encontrado</h2>
        <p className="text-[var(--muted-foreground)] mt-1">Ajuste os filtros ou faça seu primeiro upload.</p>
      </div>
    );
  }

  const groups = groupByMonth(files);

  return (
    <>
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              {group.label}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {group.files.map((file) => (
                <div
                  key={file.id}
                  role="gridcell"
                  tabIndex={0}
                  onClick={() => onFileClick(file)}
                  onKeyDown={(e) => handleKeyDown(file, e)}
                  aria-label={`${file.name} — ${file.mediaType}`}
                  className="aspect-square bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden relative group cursor-pointer hover:border-[var(--primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  {file.status === 'ready' && file.previewUrl && file.mediaType !== 'archive' ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : file.status === 'processing' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={24} className="text-[var(--muted-foreground)] animate-spin" />
                    </div>
                  ) : (
                    <FileIcon mediaType={file.mediaType} mimeType={file.mimeType} name={file.name} />
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {isFetchingNext && <Loader2 size={20} className="text-[var(--muted-foreground)] animate-spin" />}
      </div>
    </>
  );
}
