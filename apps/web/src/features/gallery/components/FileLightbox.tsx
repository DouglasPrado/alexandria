/**
 * FileLightbox — visualizador de arquivo fullscreen.
 * Fonte: docs/frontend/web/04-components.md (FileLightbox)
 * Design: Stitch — inline viewer (surface-container-low) + details sidebar (w-96)
 *
 * Navegação: ← → prev/next, Esc fecha.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  ImageIcon,
  Film,
  FileText,
  Archive,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import { useFileDetail } from '../hooks/useFileDetail';
import { useDeleteFile } from '../hooks/useDeleteFile';
import { filesApi } from '../api/files-api';
import type { FileDTO } from '../types/file.types';
import { CodingSchemeBadge } from './CodingSchemeBadge';
import { formatBytes } from '@/lib/format';

const PDFViewer = dynamic(
  () => import('./PDFViewer').then((m) => m.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 h-full justify-center" style={{ color: 'var(--muted-foreground)' }}>
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
    month: 'short',
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
  const prevFile = hasPrev ? files[currentIndex - 1] : null;

  const isPdf = file.mediaType === 'document' && file.mimeType === 'application/pdf';

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(files[currentIndex - 1]!);
  }, [hasPrev, currentIndex, files, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(files[currentIndex + 1]!);
  }, [hasNext, currentIndex, files, onNavigate]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (!isPdf && e.key === 'ArrowLeft') goPrev();
      if (!isPdf && e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext, isPdf]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const typeLabel = {
    photo: 'Photo',
    video: 'Video',
    document: 'Document',
    archive: 'Archive',
  }[file.mediaType] || file.mediaType;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${file.name}`}
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-2 rounded-full transition-colors"
        style={{ color: 'var(--muted-foreground)' }}
        aria-label="Fechar preview"
      >
        <X size={20} />
      </button>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden p-8 gap-8">
        {/* Viewer */}
        <section
          className="flex-1 rounded-3xl overflow-hidden flex flex-col relative group"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          {/* Viewer Header */}
          <div
            className="p-4 flex items-center justify-between z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center gap-4">
              <FileTypeBadge mediaType={file.mediaType} mimeType={file.mimeType} />
              <h2 className="font-display font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                {file.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                <ZoomOut size={18} />
              </button>
              <span className="text-xs font-medium px-2" style={{ color: 'var(--muted-foreground)' }}>100%</span>
              <button className="p-2 rounded-full transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                <ZoomIn size={18} />
              </button>
              <div className="w-px h-4 mx-2" style={{ backgroundColor: 'rgba(198, 198, 205, 0.3)' }} />
              <button className="p-2 rounded-full transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                <Maximize size={18} />
              </button>
            </div>
          </div>

          {/* Viewer Content */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8"
            style={{
              backgroundColor: (file.mediaType === 'document' || file.mediaType === 'archive')
                ? '#283044'
                : 'var(--surface-container)',
            }}
          >
            {renderPreview(file, isPdf)}
          </div>

          {/* Floating nav controls */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'var(--primary-container)' }}
          >
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 text-xs font-semibold tracking-widest text-white" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              {currentIndex + 1} / {files.length}
            </span>
            <button
              onClick={goNext}
              disabled={!hasNext}
              className="text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* Details Sidebar */}
        <aside className="w-96 flex flex-col gap-6 overflow-y-auto shrink-0">
          {/* Info Card */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-8"
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.04)',
            }}
          >
            <div>
              <h3
                className="font-display text-2xl font-extrabold tracking-tight"
                style={{ color: 'var(--primary-container)' }}
              >
                Detalhes
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Metadados e métricas de armazenamento
              </p>
            </div>

            <div className="space-y-6">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-y-4">
                <MetaField label="Tipo" value={typeLabel} bold />
                <MetaField label="MIME" value={file.mimeType} mono />
                <MetaField label="Tamanho original" value={formatBytes(file.originalSize)} bold />
                {file.optimizedSize && (
                  <MetaField label="Otimizado" value={formatBytes(file.optimizedSize)} bold green />
                )}
              </div>

              {/* Replication status */}
              {detail && (
                <div
                  className="p-6 rounded-2xl space-y-4"
                  style={{ backgroundColor: 'var(--surface-container-low)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                      Status de Replicação
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: 'rgba(111, 251, 190, 0.3)', color: '#005236' }}
                    >
                      {detail.replicationFactor}x Sync
                    </span>
                  </div>
                  <div
                    className="h-2 w-full rounded-full overflow-hidden flex gap-0.5"
                    style={{ backgroundColor: 'var(--surface-container-highest)' }}
                  >
                    {Array.from({ length: detail.replicationFactor }).map((_, i) => (
                      <div
                        key={i}
                        className="h-full flex-1"
                        style={{ backgroundColor: 'var(--tertiary-fixed-dim)' }}
                      />
                    ))}
                  </div>
                  {detail.codingScheme && detail.codingScheme !== 'replication' && (
                    <div className="mt-1">
                      <CodingSchemeBadge scheme={detail.codingScheme} />
                    </div>
                  )}
                </div>
              )}

              {/* Detail rows */}
              <div className="space-y-3">
                <DetailRow label="Enviado em" value={formatDate(file.createdAt)} />
                {detail && <DetailRow label="Enviado por" value={detail.uploadedBy.name} />}
                {detail && <DetailRow label="Chunks" value={`${detail.chunksCount} Segmentos`} />}
                {file.metadata?.camera && <DetailRow label="Câmera" value={file.metadata.camera} />}
                {file.metadata?.width && file.metadata?.height && (
                  <DetailRow label="Resolução" value={`${file.metadata.width} × ${file.metadata.height}`} />
                )}
                {file.metadata?.pages && <DetailRow label="Páginas" value={String(file.metadata.pages)} />}
                {file.metadata?.duration && (
                  <DetailRow
                    label="Duração"
                    value={`${Math.floor(file.metadata.duration / 60)}:${String(Math.floor(file.metadata.duration % 60)).padStart(2, '0')}`}
                  />
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-4">
              {file.status === 'ready' && (
                <button
                  onClick={async () => {
                    try {
                      const url = await filesApi.getDownloadUrl(file.id);
                      window.open(url, '_blank');
                    } catch {
                      window.location.href = filesApi.downloadUrl(file.id);
                    }
                  }}
                  className="w-full font-display font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-white active:scale-95 transition-transform"
                  style={{ backgroundColor: 'var(--primary-container)' }}
                >
                  <Download size={18} />
                  Baixar arquivo
                </button>
              )}

              {canDelete && (
                <>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full font-display font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all border-2 border-transparent"
                      style={{
                        backgroundColor: 'var(--surface-container-low)',
                        color: 'var(--destructive)',
                      }}
                    >
                      <Trash2 size={18} />
                      Excluir arquivo
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--destructive)' }}>
                        Tem certeza? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-3 rounded-xl text-sm font-bold"
                          style={{
                            backgroundColor: 'var(--surface-container-low)',
                            color: 'var(--foreground)',
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={async () => {
                            await deleteFile.mutateAsync(file.id);
                            onClose();
                          }}
                          disabled={deleteFile.isPending}
                          className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                          style={{ backgroundColor: 'var(--destructive)' }}
                        >
                          {deleteFile.isPending ? 'Excluindo...' : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Previous file card */}
          {prevFile && (
            <div
              onClick={goPrev}
              className="rounded-3xl p-6 flex items-center gap-4 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--surface-container-low)' }}
            >
              <div
                className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--surface-container-lowest)' }}
              >
                {prevFile.previewUrl && (prevFile.mediaType === 'photo' || prevFile.mediaType === 'video') ? (
                  <img src={prevFile.previewUrl} alt={prevFile.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText size={24} style={{ color: 'var(--muted-foreground)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="block text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: 'rgba(69, 70, 77, 0.6)' }}
                >
                  Arquivo anterior
                </span>
                <span className="text-sm font-display font-bold truncate block" style={{ color: 'var(--foreground)' }}>
                  {prevFile.name}
                </span>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--muted-foreground)' }} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function renderPreview(file: FileDTO, isPdf: boolean) {
  if (file.status === 'processing') {
    return (
      <div className="flex flex-col items-center gap-3" style={{ color: 'var(--muted-foreground)' }}>
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
        className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl"
      />
    );
  }

  if (file.mediaType === 'video' && file.previewUrl) {
    return (
      <video
        src={file.previewUrl}
        controls
        className="max-h-[70vh] max-w-full rounded-xl"
        aria-label={`Vídeo: ${file.name}`}
      />
    );
  }

  if (isPdf) {
    return (
      <PDFViewer
        downloadUrl={filesApi.downloadUrl(file.id)}
        filename={file.name}
        initialPages={file.metadata?.pages}
      />
    );
  }

  const Icon = file.mediaType === 'video' ? Film
    : file.mediaType === 'photo' ? ImageIcon
    : file.mediaType === 'archive' ? Archive
    : FileText;

  return (
    <div className="flex flex-col items-center gap-3 text-white/60">
      <Icon size={64} />
      <span className="text-sm">{file.name}</span>
    </div>
  );
}

function FileTypeBadge({ mediaType, mimeType }: { mediaType: string; mimeType: string }) {
  const isPdf = mimeType === 'application/pdf';
  const isPhoto = mediaType === 'photo';
  const isVideo = mediaType === 'video';

  let bg = 'var(--surface-container-high)';
  let color = 'var(--muted-foreground)';
  let Icon = FileText;

  if (isPdf) {
    bg = 'var(--destructive)';
    color = 'white';
  } else if (isPhoto) {
    bg = 'var(--accent)';
    color = 'white';
    Icon = ImageIcon;
  } else if (isVideo) {
    bg = 'var(--primary-container)';
    color = 'white';
    Icon = Film;
  } else if (mediaType === 'archive') {
    Icon = Archive;
  }

  return (
    <div className="p-2 rounded-lg" style={{ backgroundColor: bg, color }}>
      <Icon size={18} />
    </div>
  );
}

function MetaField({ label, value, bold, mono, green }: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  green?: boolean;
}) {
  return (
    <div>
      <span
        className="block text-[10px] uppercase tracking-[0.15em] font-bold mb-1"
        style={{ color: 'rgba(69, 70, 77, 0.6)' }}
      >
        {label}
      </span>
      <span
        className={`${bold ? 'font-display font-bold' : ''} ${mono ? 'font-mono text-xs font-semibold' : ''}`}
        style={{ color: green ? 'var(--success)' : 'var(--foreground)' }}
      >
        {value}
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex justify-between text-xs py-2"
      style={{ borderBottom: '1px solid rgba(198, 198, 205, 0.1)' }}
    >
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{value}</span>
    </div>
  );
}
