/**
 * FileDetailPage — detalhe do arquivo com preview, metadados e download.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/file/:id)
 *
 * Rota: /dashboard/file/[id]
 * Auth: JWT (qualquer role)
 */
'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2, Loader2, ImageIcon, Film, FileText, Archive } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useFileDetail, useDeleteFile, filesApi, VersionHistoryPanel } from '@/features/gallery';
import { formatBytes } from '@/lib/format';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const role = useAuthStore((s) => s.member?.role);
  const canDelete = role === 'admin' || role === 'member';
  const { data: file, isLoading } = useFileDetail(id);
  const deleteFile = useDeleteFile();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="text-[var(--muted-foreground)] animate-spin" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted-foreground)]">Arquivo não encontrado.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-4 text-sm text-[var(--primary)] hover:underline">
          Voltar para a galeria
        </button>
      </div>
    );
  }

  const Icon = file.mediaType === 'photo' ? ImageIcon : file.mediaType === 'video' ? Film : file.mediaType === 'archive' ? Archive : FileText;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] flex items-center justify-center min-h-[400px] p-4">
          {file.status === 'processing' ? (
            <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
              <Loader2 size={40} className="animate-spin" />
              <span>Processando...</span>
            </div>
          ) : file.mediaType === 'photo' && file.previewUrl ? (
            <img src={file.previewUrl} alt={file.name} className="max-h-[70vh] max-w-full object-contain rounded" />
          ) : file.mediaType === 'video' && file.previewUrl ? (
            <video src={file.previewUrl} controls className="max-h-[70vh] max-w-full rounded" />
          ) : (
            <Icon size={64} className="text-[var(--muted-foreground)]" />
          )}
        </div>

        {/* Metadata */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-5">
          <h1 className="font-semibold text-[var(--foreground)] text-lg break-words">{file.name}</h1>

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
              <dt className="text-[var(--muted-foreground)]">Enviado por</dt>
              <dd className="text-[var(--foreground)]">{file.uploadedBy.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Enviado em</dt>
              <dd className="text-[var(--foreground)]">{formatDate(file.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Chunks</dt>
              <dd className="text-[var(--foreground)]">{file.chunksCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Replicação</dt>
              <dd className="text-[var(--foreground)]">{file.replicationFactor}x</dd>
            </div>
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
          </dl>

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

          {canDelete && (
            <div className="pt-3 border-t border-[var(--border)]">
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
                        router.push('/dashboard');
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
        </div>
      </div>

      {/* Version History */}
      <VersionHistoryPanel fileId={id} canUpload={canDelete} />
    </div>
  );
}
