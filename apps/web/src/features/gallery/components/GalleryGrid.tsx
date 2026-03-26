/**
 * GalleryGrid — grid responsivo de thumbnails com infinite scroll.
 * Fonte: docs/frontend/web/04-components.md (GalleryGrid)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 3: Visualizar Acervo)
 *
 * Usa IntersectionObserver para carregar mais ao scroll.
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ImageIcon,
  Film,
  FileText,
  FileSpreadsheet,
  FileAudio,
  Archive,
  Loader2,
  File,
  type LucideIcon,
} from 'lucide-react';
import type { FileDTO } from '../types/file.types';

interface GalleryGridProps {
  files: FileDTO[];
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNext: boolean;
  onLoadMore: () => void;
  onFileClick: (file: FileDTO) => void;
}

interface FileAppearance {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

function getFileAppearance(mediaType: string, mimeType: string, name: string): FileAppearance {
  if (mimeType === 'application/pdf') {
    return { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10', label: 'PDF' };
  }
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.oasis.opendocument.text'
  ) {
    return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'DOC' };
  }
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.oasis.opendocument.spreadsheet' ||
    mimeType === 'text/csv'
  ) {
    return { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-500/10', label: 'XLS' };
  }
  if (mimeType.startsWith('audio/')) {
    return { icon: FileAudio, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'AUDIO' };
  }
  if (mediaType === 'archive' || mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('7z') || mimeType.includes('rar')) {
    return { icon: Archive, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'ZIP' };
  }
  if (mediaType === 'video' || mimeType.startsWith('video/')) {
    return { icon: Film, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10', label: 'VIDEO' };
  }
  if (mediaType === 'photo' || mimeType.startsWith('image/')) {
    return { icon: ImageIcon, color: 'text-[var(--info)]', bg: 'bg-[var(--info)]/10', label: 'IMG' };
  }
  const ext = name.includes('.') ? name.split('.').pop()?.toUpperCase() ?? 'FILE' : 'FILE';
  return { icon: File, color: 'text-[var(--muted-foreground)]', bg: 'bg-[var(--muted)]', label: ext };
}

function FileIcon({ mediaType, mimeType, name }: { mediaType: string; mimeType: string; name: string }) {
  const { icon: Icon, color, bg, label } = getFileAppearance(mediaType, mimeType, name);
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 ${bg}`}>
      <Icon size={32} className={color} />
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${color} opacity-80`}>{label}</span>
    </div>
  );
}

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
