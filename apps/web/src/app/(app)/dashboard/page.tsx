'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useUploadStore } from '@/store/upload-store';
import { Upload, ImageIcon, Film, FileText } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  mediaType: string;
  status: string;
  previewUrl: string;
  createdAt: string;
}

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['files'],
    queryFn: () => apiClient.get<{ data: FileItem[]; meta: { hasMore: boolean } }>('/files'),
  });

  const addFiles = useUploadStore((s) => s.addFiles);

  const handleUpload = useCallback(
    async (files: File[]) => {
      addFiles(files);
      for (const file of files) {
        try {
          await apiClient.upload('/files/upload', file);
        } catch { /* handled by store */ }
      }
      refetch();
    },
    [addFiles, refetch],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleUpload(Array.from(e.dataTransfer.files));
    },
    [handleUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleUpload(Array.from(e.target.files || []));
    },
    [handleUpload],
  );

  const mediaIcon = (type: string) => {
    if (type === 'photo') return <ImageIcon size={24} className="text-[var(--info)]" />;
    if (type === 'video') return <Film size={24} className="text-[var(--accent)]" />;
    return <FileText size={24} className="text-[var(--muted-foreground)]" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Galeria</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 transition-opacity text-sm"
        >
          <Upload size={16} />
          Upload
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,application/pdf" onChange={handleFileInput} className="hidden" />
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-[var(--border)] rounded-[var(--radius)] p-10 text-center hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
        <p className="text-[var(--foreground)] font-medium">Arraste arquivos aqui ou clique para selecionar</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Fotos, videos e documentos — ate 10 GB por arquivo</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[var(--muted)] rounded-[var(--radius)] animate-pulse" />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <div className="text-center py-20">
          <ImageIcon size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Nenhum arquivo ainda</h2>
          <p className="text-[var(--muted-foreground)] mt-1 mb-4">
            Faca seu primeiro upload para comecar a construir o acervo familiar.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Fazer primeiro upload
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3" aria-label="Galeria de arquivos em grade">
          {data.data.map((file) => (
            <div
              key={file.id}
              className="aspect-square bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden relative group cursor-pointer hover:border-[var(--primary)] transition-colors"
              aria-label={`${file.name} — ${file.mediaType}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {file.status === 'processing' ? (
                  <span className="text-xs text-[var(--muted-foreground)] animate-pulse">Processando...</span>
                ) : (
                  mediaIcon(file.mediaType)
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-[var(--foreground)]/80 px-2 py-1.5 text-xs text-[var(--background)] opacity-0 group-hover:opacity-100 transition-opacity truncate">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
