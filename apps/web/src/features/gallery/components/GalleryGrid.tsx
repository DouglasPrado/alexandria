/**
 * GalleryGrid — grid responsivo de thumbnails com infinite scroll.
 * Fonte: docs/frontend/web/04-components.md (GalleryGrid)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 3: Visualizar Acervo)
 * Design: Stitch — cards 4/3 sem borders, nome + tamanho abaixo, ícone de tipo para docs
 *
 * Usa IntersectionObserver para carregar mais ao scroll.
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ImageIcon, Loader2, Play, FileText, FileSpreadsheet, FileArchive, File } from 'lucide-react';
import type { FileDTO } from '../types/file.types';
import { formatBytes } from '@/lib/format';

interface GalleryGridProps {
  files: FileDTO[];
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNext: boolean;
  onLoadMore: () => void;
  onFileClick: (file: FileDTO) => void;
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div
              className="aspect-[4/3] rounded-xl animate-pulse"
              style={{ backgroundColor: 'var(--surface-container-low)' }}
            />
            <div
              className="h-3 w-3/4 rounded mt-2 animate-pulse"
              style={{ backgroundColor: 'var(--surface-container-low)' }}
            />
            <div
              className="h-2.5 w-1/3 rounded mt-1 animate-pulse"
              style={{ backgroundColor: 'var(--surface-container-low)' }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-20">
        <ImageIcon size={48} className="mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
        <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--foreground)' }}>
          Nenhum arquivo encontrado
        </h2>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Ajuste os filtros ou faça seu primeiro upload.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        role="grid"
        aria-label="Galeria de arquivos"
      >
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onClick={() => onFileClick(file)}
            onKeyDown={(e) => handleKeyDown(file, e)}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {isFetchingNext && (
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />
        )}
      </div>
    </>
  );
}

/**
 * FileCard — card individual de arquivo.
 * Design Stitch: aspect-4/3, rounded-xl, sem border, nome+tamanho abaixo,
 * ícone de play para vídeos, ícone de tipo para docs/archives.
 */
function FileCard({
  file,
  onClick,
  onKeyDown,
}: {
  file: FileDTO;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const isPhoto = file.mediaType === 'photo';
  const isVideo = file.mediaType === 'video';
  const hasPreview = file.status === 'ready' && file.previewUrl;

  return (
    <div
      role="gridcell"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded-xl"
      aria-label={`${file.name} — ${file.mediaType}`}
    >
      {/* Thumbnail */}
      <div
        className="aspect-[4/3] rounded-xl overflow-hidden relative transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]"
        style={{ backgroundColor: 'var(--surface-container-low)' }}
      >
        {hasPreview && (isPhoto || isVideo) ? (
          <img
            src={file.previewUrl}
            alt={file.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : file.status === 'processing' ? (
          <div className="absolute inset-0 flex items-center justify-center" data-testid="icon-processing">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DocTypeIcon mimeType={file.mimeType} mediaType={file.mediaType} />
          </div>
        )}

        {/* Video play icon overlay */}
        {isVideo && hasPreview && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0, 27, 61, 0.6)' }}
            >
              <Play size={18} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Status badge — error */}
        {file.status === 'error' && (
          <div
            className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
            style={{ backgroundColor: 'var(--destructive)' }}
          >
            Erro
          </div>
        )}
      </div>

      {/* File info below card */}
      <div className="mt-2 px-0.5">
        <p
          className="text-xs font-medium truncate"
          style={{ color: 'var(--foreground)' }}
        >
          {file.name}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {formatBytes(file.originalSize)}
        </p>
      </div>
    </div>
  );
}

/**
 * DocTypeIcon — ícone grande centralizado para tipos não-imagem.
 * PDF = vermelho, Word = azul, planilha = verde, archive = muted, fallback = file
 */
function DocTypeIcon({ mimeType, mediaType }: { mimeType: string; mediaType: string }) {
  const mime = mimeType.toLowerCase();

  if (mime.includes('pdf')) {
    return (
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--destructive)', color: 'white' }}
      >
        <FileText size={28} />
      </div>
    );
  }

  if (mime.includes('word') || mime.includes('docx') || mime.includes('doc')) {
    return (
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
      >
        <FileText size={28} />
      </div>
    );
  }

  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) {
    return (
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--success)', color: 'white' }}
      >
        <FileSpreadsheet size={28} />
      </div>
    );
  }

  if (mediaType === 'archive') {
    return (
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--muted-foreground)' }}
      >
        <FileArchive size={28} />
      </div>
    );
  }

  return (
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center"
      style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--muted-foreground)' }}
    >
      <File size={28} />
    </div>
  );
}
