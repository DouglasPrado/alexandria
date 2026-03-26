/**
 * Dashboard / Galeria — página principal do app.
 * Fonte: docs/frontend/web/07-routes.md (GalleryPage)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 2: Upload, Fluxo 3: Visualizar)
 *
 * Rota: /dashboard
 * Layout: AppLayout
 * Auth: JWT (qualquer role)
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
  GalleryGrid,
  FileLightbox,
  UploadDropzone,
  UploadQueue,
  SearchBar,
  useFiles,
  useUploadFiles,
  type FileDTO,
  type MediaType,
} from '@/features/gallery';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useAuthStore((s) => s.member?.role);
  const canUpload = role === 'admin' || role === 'member';

  // URL state for filters
  const query = searchParams.get('q') ?? '';
  const mediaType = (searchParams.get('type') as MediaType) || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  // Files query with infinite scroll
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFiles({ q: query || undefined, mediaType, from, to });

  const files = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  // Upload
  const { upload } = useUploadFiles();

  // Lightbox state
  const [lightboxFile, setLightboxFile] = useState<FileDTO | null>(null);

  // URL state handlers
  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      // Remove cursor when filters change
      params.delete('cursor');
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handleQueryChange = useCallback(
    (q: string) => updateSearchParams({ q: q || undefined }),
    [updateSearchParams],
  );

  const handleMediaTypeChange = useCallback(
    (type: MediaType | undefined) => updateSearchParams({ type }),
    [updateSearchParams],
  );

  const handleFromChange = useCallback(
    (iso: string | undefined) => updateSearchParams({ from: iso }),
    [updateSearchParams],
  );

  const handleToChange = useCallback(
    (iso: string | undefined) => updateSearchParams({ to: iso }),
    [updateSearchParams],
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Galeria</h1>
        {canUpload && (
          <label className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 transition-opacity text-sm cursor-pointer">
            <Upload size={16} />
            Upload
            <input
              type="file"
              multiple
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const f = Array.from(e.target.files ?? []) as File[];
                if (f.length > 0) upload(f);
                (e.target as HTMLInputElement).value = '';
              }}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Search + Filters */}
      <SearchBar
        query={query}
        mediaType={mediaType}
        from={from}
        to={to}
        onQueryChange={handleQueryChange}
        onMediaTypeChange={handleMediaTypeChange}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
      />

      {/* Dropzone — only when gallery is empty and user can upload */}
      {canUpload && !isLoading && files.length === 0 && !query && !mediaType && (
        <UploadDropzone onFiles={upload} />
      )}

      {/* Gallery Grid */}
      <GalleryGrid
        files={files}
        hasMore={!!hasNextPage}
        isLoading={isLoading}
        isFetchingNext={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        onFileClick={setLightboxFile}
      />

      {/* Lightbox */}
      {lightboxFile && (
        <FileLightbox
          file={lightboxFile}
          files={files}
          canDelete={canUpload}
          onClose={() => setLightboxFile(null)}
          onNavigate={setLightboxFile}
        />
      )}

      {/* Upload Queue (floating) */}
      <UploadQueue />
    </div>
  );
}
