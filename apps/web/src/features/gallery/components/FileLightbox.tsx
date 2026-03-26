/**
 * FileLightbox — modal fullscreen com preview, navegação prev/next e metadados.
 * Fonte: docs/frontend/web/04-components.md (FileLightbox)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 3)
 *
 * Navegação: ← → prev/next, Esc fecha.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight, Download, Trash2, ImageIcon, Film, FileText, Archive, Loader2 } from 'lucide-react';
import { useFileDetail } from '../hooks/useFileDetail';
import { useDeleteFile } from '../hooks/useDeleteFile';
import { filesApi } from '../api/files-api';
import type { FileDTO } from '../types/file.types';
import { formatBytes } from '@/lib/format';

const PDFViewer = dynamic(
  () => import('./PDFViewer').then((m) => m.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 text-white/40 h-full justify-center">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Carregando leitor…</span>
      </div>
    ),
  },
);

interface FileLightboxProps {
  file: FileDTO;
  files: FileDTO[];
  canDelete?: boolean;
  onClose: () => void;
  onNavigate: (file: FileDTO) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FileLightbox({ file, files, canDelete, onClose, onNavigate }: FileLightboxProps) {
  const { data: detail } = useFileDetail(file.id);
  const deleteFile = useDeleteFile();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const currentIndex = files.findIndex((f) => f.id === file.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  // Quando exibindo PDF, as setas ficam com o PDFViewer (navegação de páginas)
  const isPdf = file.mediaType === 'document' && file.mimeType === 'application/pdf';

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(files[currentIndex - 1]!);
  }, [hasPrev, currentIndex, files, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(files[currentIndex + 1]!);
  }, [hasNext, currentIndex, files, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      // Setas delegadas ao PDFViewer quando lendo PDF
      if (!isPdf && e.key === 'ArrowLeft') goPrev();
      if (!isPdf && e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const renderPreview = () => {
    if (file.status === 'processing') {
      return (
        <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
          <Loader2 size={40} className="animate-spin" />
          <span className="text-sm">Processando...</span>
        </div>
      );
    }

    if (file.mediaType === 'photo' && file.previewUrl) {
      return (
        <img
          src={file.previewUrl}
          alt={file.name}
          className="max-h-[80vh] max-w-full object-contain rounded"
        />
      );
    }

    if (file.mediaType === 'video' && file.previewUrl) {
      return (
        <video
          src={file.previewUrl}
          controls
          className="max-h-[80vh] max-w-full rounded"
          aria-label={`Vídeo: ${file.name}`}
        />
      );
    }

    // PDF — leitor completo com navegação por páginas
    if (isPdf) {
      return (
        <PDFViewer
          downloadUrl={filesApi.downloadUrl(file.id)}
          filename={file.name}
          initialPages={file.metadata?.pages}
        />
      );
    }

    // Fallback — document (non-PDF), archive or missing preview
    const Icon = file.mediaType === 'video' ? Film : file.mediaType === 'photo' ? ImageIcon : file.mediaType === 'archive' ? Archive : FileText;
    return (
      <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
        <Icon size={64} />
        <span className="text-sm">{file.name}</span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${file.name}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Fechar preview"
      >
        <X size={24} />
      </button>

      {/* Prev button */}
      {hasPrev && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/50 hover:text-white transition-colors"
          aria-label="Arquivo anterior"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={goNext}
          className="absolute right-80 top-1/2 -translate-y-1/2 z-10 p-2 text-white/50 hover:text-white transition-colors"
          aria-label="Próximo arquivo"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Preview area — PDF viewer ocupa toda a altura sem padding */}
      <div className={`flex-1 min-w-0 min-h-0 ${isPdf ? 'flex flex-col overflow-hidden' : 'flex items-center justify-center p-8'}`}>
        {renderPreview()}
      </div>

      {/* Metadata sidebar */}
      <aside className="w-80 bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto p-5 space-y-5">
        <h2 className="font-semibold text-[var(--foreground)] text-lg truncate" title={file.name}>
          {file.name}
        </h2>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[var(--muted-foreground)]">Tipo</dt>
            <dd className="text-[var(--foreground)] capitalize">{file.mediaType}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">MIME</dt>
            <dd className="text-[var(--foreground)] font-mono text-xs">{file.mimeType}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">Tamanho original</dt>
            <dd className="text-[var(--foreground)]">{formatBytes(file.originalSize)}</dd>
          </div>
          {file.optimizedSize && (
            <div>
              <dt className="text-[var(--muted-foreground)]">Tamanho otimizado</dt>
              <dd className="text-[var(--foreground)]">{formatBytes(file.optimizedSize)}</dd>
            </div>
          )}
          <div>
            <dt className="text-[var(--muted-foreground)]">Enviado em</dt>
            <dd className="text-[var(--foreground)]">{formatDate(file.createdAt)}</dd>
          </div>

          {/* Detail data from API */}
          {detail && (
            <>
              <div>
                <dt className="text-[var(--muted-foreground)]">Enviado por</dt>
                <dd className="text-[var(--foreground)]">{detail.uploadedBy.name}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Chunks</dt>
                <dd className="text-[var(--foreground)]">{detail.chunksCount}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Replicação</dt>
                <dd className="text-[var(--foreground)]">{detail.replicationFactor}x</dd>
              </div>
            </>
          )}

          {/* EXIF metadata */}
          {file.metadata?.camera && (
            <div>
              <dt className="text-[var(--muted-foreground)]">Câmera</dt>
              <dd className="text-[var(--foreground)]">{file.metadata.camera}</dd>
            </div>
          )}
          {file.metadata?.width && file.metadata?.height && (
            <div>
              <dt className="text-[var(--muted-foreground)]">Resolução</dt>
              <dd className="text-[var(--foreground)]">{file.metadata.width} × {file.metadata.height}</dd>
            </div>
          )}
          {file.metadata?.pages && (
            <div>
              <dt className="text-[var(--muted-foreground)]">Páginas</dt>
              <dd className="text-[var(--foreground)]">{file.metadata.pages}</dd>
            </div>
          )}
          {file.metadata?.duration && (
            <div>
              <dt className="text-[var(--muted-foreground)]">Duração</dt>
              <dd className="text-[var(--foreground)]">
                {Math.floor(file.metadata.duration / 60)}:{String(Math.floor(file.metadata.duration % 60)).padStart(2, '0')}
              </dd>
            </div>
          )}
        </dl>

        {/* Download button */}
        {file.status === 'ready' && (
          <a
            href={filesApi.downloadUrl(file.id)}
            download={file.name}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 transition-opacity text-sm"
          >
            <Download size={16} />
            Baixar arquivo
          </a>
        )}

        {/* Delete button */}
        {canDelete && (
          <div className="pt-2 border-t border-[var(--border)]">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-[var(--destructive)] text-[var(--destructive)] rounded-[var(--radius)] font-medium hover:bg-[var(--destructive)]/10 transition-colors text-sm"
              >
                <Trash2 size={16} />
                Excluir arquivo
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--destructive)] font-medium">
                  Tem certeza? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 border border-[var(--border)] rounded-[var(--radius)] text-[var(--foreground)] text-sm hover:bg-[var(--secondary)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      await deleteFile.mutateAsync(file.id);
                      onClose();
                    }}
                    disabled={deleteFile.isPending}
                    className="flex-1 py-2 bg-[var(--destructive)] text-white rounded-[var(--radius)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {deleteFile.isPending ? 'Excluindo...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
