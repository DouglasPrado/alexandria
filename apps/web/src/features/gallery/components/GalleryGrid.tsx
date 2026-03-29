/**
 * GalleryGrid — grid responsivo de thumbnails com infinite scroll.
 * Fonte: docs/frontend/web/04-components.md (GalleryGrid)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 3: Visualizar Acervo)
 *
 * Usa IntersectionObserver para carregar mais ao scroll.
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import type { FileDTO } from '../types/file.types';
import { FileIcon } from './FileIcon';

export function GalleryGrid({
  files,
  hasMore,
  isLoading,
  isFetchingNext,
  onLoadMore,
  onFileClick,
}: GalleryGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetchingNext) {
          onLoadMore();
        }
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="aspect-square bg-[var(--muted)] rounded-[var(--radius)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-20">
        <ImageIcon size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Nenhum arquivo encontrado</h2>
        <p className="text-[var(--muted-foreground)] mt-1">
          Ajuste os filtros ou faça seu primeiro upload.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
        role="grid"
        aria-label="Galeria de arquivos"
      >
        {files.map((file) => (
          <div
            key={file.id}
            role="gridcell"
            tabIndex={0}
            onClick={() => onFileClick(file)}
            onKeyDown={(e) => handleKeyDown(file, e)}
            className="aspect-square bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden relative group cursor-pointer hover:border-[var(--primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            aria-label={`${file.name} — ${file.mediaType}`}
          >
            {file.status === 'ready' && file.previewUrl && file.mediaType !== 'archive' ? (
              <img
                src={file.previewUrl}
                alt={file.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : file.status === 'processing' ? (
              <div className="absolute inset-0 flex items-center justify-center" data-testid="icon-processing">
                <Loader2 size={24} className="text-[var(--muted-foreground)] animate-spin" />
              </div>
            ) : (
              <FileIcon mediaType={file.mediaType} mimeType={file.mimeType} name={file.name} />
            )}

            {/* Hover overlay with filename */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
              {file.name}
            </div>

            {/* Status badge */}
            {file.status === 'error' && (
              <div className="absolute top-1.5 right-1.5 bg-[var(--destructive)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                Erro
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {isFetchingNext && <Loader2 size={20} className="text-[var(--muted-foreground)] animate-spin" />}
      </div>
    </>
  );
}
