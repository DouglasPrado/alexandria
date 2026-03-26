/**
 * SearchPage — busca avançada com filtros de nome, tipo e período.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/search)
 * Fonte: docs/blueprint/08-use_cases.md (UC-010 — Buscar e Navegar pelo Acervo)
 *
 * Rota: /dashboard/search
 * Auth: JWT (qualquer role)
 * URL state: ?q=natal&type=photo&from=2025-01-01T00:00:00.000Z&to=2025-12-31T23:59:59.999Z
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  GalleryGrid,
  FileLightbox,
  SearchBar,
  useFiles,
  type FileDTO,
  type MediaType,
} from '@/features/gallery';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useAuthStore((s) => s.member?.role);
  const canDelete = role === 'admin' || role === 'member';

  const query = searchParams.get('q') ?? '';
  const mediaType = (searchParams.get('type') as MediaType) || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useFiles({
    q: query || undefined,
    mediaType,
    from,
    to,
  });

  const files = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const [lightboxFile, setLightboxFile] = useState<FileDTO | null>(null);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.replace(`/dashboard/search?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Busca</h1>

      <SearchBar
        query={query}
        mediaType={mediaType}
        from={from}
        to={to}
        onQueryChange={(q) => updateSearchParams({ q: q || undefined })}
        onMediaTypeChange={(type) => updateSearchParams({ type })}
        onFromChange={(f) => updateSearchParams({ from: f })}
        onToChange={(t) => updateSearchParams({ to: t })}
      />

      <GalleryGrid
        files={files}
        hasMore={!!hasNextPage}
        isLoading={isLoading}
        isFetchingNext={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        onFileClick={setLightboxFile}
      />

      {lightboxFile && (
        <FileLightbox
          file={lightboxFile}
          files={files}
          canDelete={canDelete}
          onClose={() => setLightboxFile(null)}
          onNavigate={setLightboxFile}
        />
      )}
    </div>
  );
}
