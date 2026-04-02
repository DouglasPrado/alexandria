/**
 * Dashboard / Galeria — página principal do app.
 * Fonte: docs/frontend/web/07-routes.md (GalleryPage)
 * Fonte: docs/frontend/web/08-flows.md (Fluxo 2: Upload, Fluxo 3: Visualizar)
 * Design: Stitch — Alexandria Protocol (Asymmetric Grid, Tonal Layering)
 *
 * Rota: /dashboard
 * Layout: AppLayout
 * Auth: JWT (qualquer role)
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Clock,
  Image,
  Video,
  FileText,
  Archive,
  CloudUpload,
  Check,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Plus,
} from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { useAuthStore } from '@/store/auth-store';
import { useClusterStats } from '@/features/cluster';
import { DatePicker } from '@/components/ui/date-picker';
import {
  GalleryGrid,
  TimelineView,
  FileLightbox,
  UploadDropzone,
  UploadQueue,
  useFiles,
  useUploadFiles,
  type FileDTO,
  type GalleryView,
  type MediaType,
} from '@/features/gallery';

/** Converte ISO string para Date local (sem shift de timezone) */
function isoToDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const dateStr = iso.slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y!, m! - 1, d);
}

const mediaFilters: { type: MediaType | undefined; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { type: undefined, label: 'Todos', icon: LayoutGrid },
  { type: 'photo', label: 'Fotos', icon: Image },
  { type: 'video', label: 'Vídeos', icon: Video },
  { type: 'document', label: 'Documentos', icon: FileText },
  { type: 'archive', label: 'Arquivos', icon: Archive },
];

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useAuthStore((s) => s.member?.role);
  const canUpload = role === 'admin' || role === 'member';

  // URL state for filters + view mode
  const query = searchParams.get('q') ?? '';
  const mediaType = (searchParams.get('type') as MediaType) || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const view: GalleryView = (searchParams.get('view') as GalleryView) || 'grid';

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
    (date: Date | undefined) => {
      updateSearchParams({ from: date ? startOfDay(date).toISOString() : undefined });
    },
    [updateSearchParams],
  );

  const handleToChange = useCallback(
    (date: Date | undefined) => {
      updateSearchParams({ to: date ? endOfDay(date).toISOString() : undefined });
    },
    [updateSearchParams],
  );

  const toggleView = useCallback(
    () => updateSearchParams({ view: view === 'grid' ? 'timeline' : 'grid' }),
    [view, updateSearchParams],
  );

  const isEmpty = !isLoading && files.length === 0;

  return (
    <>
      {/* Header & Filters */}
      <section className="mb-10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2
              className="text-4xl font-black font-display tracking-tighter"
              style={{ color: 'var(--foreground)' }}
            >
              Galeria de Arquivos
            </h2>
            <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Gerencie e organize sua biblioteca digital Alexandria.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <button
              onClick={toggleView}
              aria-label={view === 'grid' ? 'Linha do tempo' : 'Grade'}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {view === 'grid' ? <Clock size={18} /> : <LayoutGrid size={18} />}
            </button>
            {/* Date range */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Início
                </span>
                <DatePicker
                  value={isoToDate(from)}
                  onChange={handleFromChange}
                  placeholder="Data início"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Fim
                </span>
                <DatePicker
                  value={isoToDate(to)}
                  onChange={handleToChange}
                  placeholder="Data fim"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Filters (Chips) */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {mediaFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = mediaType === filter.type;
            return (
              <button
                key={filter.label}
                onClick={() => handleMediaTypeChange(filter.type)}
                className="px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
                style={
                  isActive
                    ? { backgroundColor: 'var(--primary-container)', color: 'white' }
                    : {
                        backgroundColor: 'var(--surface-container-lowest)',
                        color: 'var(--muted-foreground)',
                        border: '1px solid var(--outline-variant)',
                      }
                }
              >
                {filter.type && <Icon size={14} />}
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Asymmetric Layout: Content Grid (9 cols) + Sidebar (3 cols) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-9">
          {/* Empty state */}
          {isEmpty && !query && !mediaType ? (
            <EmptyState canUpload={canUpload} onUpload={upload} onClearFilters={() => handleMediaTypeChange(undefined)} />
          ) : isEmpty ? (
            <div
              className="rounded-xl flex flex-col items-center justify-center min-h-[400px] p-12 text-center"
              style={{ backgroundColor: 'var(--surface-container-low)' }}
            >
              <h3 className="text-xl font-bold font-display" style={{ color: 'var(--foreground)' }}>
                Nenhum arquivo encontrado
              </h3>
              <p className="mt-2 mb-6" style={{ color: 'var(--muted-foreground)' }}>
                Ajuste os filtros de pesquisa.
              </p>
              <button
                onClick={() => {
                  handleMediaTypeChange(undefined);
                  handleQueryChange('');
                }}
                className="px-8 py-3 rounded-lg font-bold transition-all"
                style={{
                  backgroundColor: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  color: 'var(--primary-container)',
                }}
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <>
              {/* Dropzone (shown when empty and no filters) */}
              {canUpload && isEmpty && (
                <UploadDropzone onFiles={upload} />
              )}

              {/* Gallery — Grid or Timeline */}
              {view === 'timeline' ? (
                <TimelineView
                  files={files}
                  hasMore={!!hasNextPage}
                  isLoading={isLoading}
                  isFetchingNext={isFetchingNextPage}
                  onLoadMore={() => fetchNextPage()}
                  onFileClick={setLightboxFile}
                />
              ) : (
                <GalleryGrid
                  files={files}
                  hasMore={!!hasNextPage}
                  isLoading={isLoading}
                  isFetchingNext={isFetchingNextPage}
                  onLoadMore={() => fetchNextPage()}
                  onFileClick={setLightboxFile}
                />
              )}
            </>
          )}
        </div>

        {/* Secondary Column: Activity + Storage */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <ActivitySidebar />
          <StorageCard />
        </aside>
      </div>

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

      {/* FAB — floating upload button */}
      {canUpload && (
        <label
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 z-50"
          style={{ backgroundColor: 'var(--primary-container)' }}
        >
          <Plus size={28} className="text-white" />
          <input
            type="file"
            multiple
            onChange={(e) => {
              const f = Array.from(e.target.files ?? []) as File[];
              if (f.length > 0) upload(f);
              (e.target as HTMLInputElement).value = '';
            }}
            className="hidden"
          />
        </label>
      )}
    </>
  );
}

/**
 * EmptyState — empty gallery with illustration placeholder.
 * Stitch design: big gradient circle + text + CTA buttons
 */
function EmptyState({
  canUpload,
  onUpload,
  onClearFilters,
}: {
  canUpload: boolean;
  onUpload: (files: File[]) => void;
  onClearFilters: () => void;
}) {
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center min-h-[500px] p-12 text-center border-2 border-dashed"
      style={{
        backgroundColor: 'var(--surface-container-low)',
        borderColor: 'rgba(198, 198, 205, 0.3)',
      }}
    >
      {/* Gradient circle placeholder */}
      <div
        className="w-64 h-64 mb-8 rounded-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--surface-container-highest), white)',
        }}
      >
        <CloudUpload size={64} style={{ color: 'var(--outline-variant)' }} className="relative z-10" />
      </div>

      <h3 className="text-2xl font-bold font-display" style={{ color: 'var(--foreground)' }}>
        Nenhum arquivo encontrado
      </h3>
      <p className="max-w-md mt-2 mb-8" style={{ color: 'var(--muted-foreground)' }}>
        Ajuste os filtros de pesquisa ou faça seu primeiro upload para começar a construir sua biblioteca digital.
      </p>

      <div className="flex gap-4">
        {canUpload && (
          <label
            className="px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer hover:opacity-90 active:scale-95 text-white"
            style={{ backgroundColor: 'var(--primary-container)' }}
          >
            <CloudUpload size={18} />
            Fazer Upload
            <input
              type="file"
              multiple
              onChange={(e) => {
                const f = Array.from(e.target.files ?? []) as File[];
                if (f.length > 0) onUpload(f);
                (e.target as HTMLInputElement).value = '';
              }}
              className="hidden"
            />
          </label>
        )}
        <button
          onClick={onClearFilters}
          className="px-8 py-3 rounded-lg font-bold transition-all"
          style={{
            backgroundColor: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-variant)',
            color: 'var(--primary-container)',
          }}
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
}

/**
 * ActivitySidebar — timeline of recent events.
 * Stitch design: white card with vertical timeline dots
 */
function ActivitySidebar() {
  const events = [
    {
      icon: Check,
      label: 'Upload concluído',
      detail: 'System-Node-01 • Há 2 horas',
      bg: 'var(--tertiary-fixed)',
      color: '#002113',
    },
    {
      icon: RefreshCw,
      label: 'Indexação de metadados',
      detail: 'Automated Tool • Ontem',
      bg: 'var(--secondary-container)',
      color: 'var(--secondary)',
    },
    {
      icon: AlertTriangle,
      label: 'Falha na conexão',
      detail: 'Cluster-Main-Alpha • 2 dias atrás',
      bg: 'var(--destructive)',
      color: 'white',
    },
  ];

  return (
    <div
      className="p-6 rounded-xl shadow-sm"
      style={{
        backgroundColor: 'var(--surface-container-lowest)',
        border: '1px solid var(--surface-container-low)',
      }}
    >
      <h4
        className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Clock size={16} />
        Atividade Recente
      </h4>

      {/* Timeline */}
      <div className="space-y-6 relative">
        {/* Vertical line */}
        <div
          className="absolute left-[11px] top-2 bottom-2 w-[2px]"
          style={{ backgroundColor: 'var(--surface-container-high)' }}
        />

        {events.map((event, i) => {
          const Icon = event.icon;
          return (
            <div key={i} className="relative pl-8">
              <div
                className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10"
                style={{ backgroundColor: event.bg }}
              >
                <Icon size={12} style={{ color: event.color }} />
              </div>
              <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                {event.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {event.detail}
              </p>
            </div>
          );
        })}
      </div>

      <button
        className="w-full mt-8 py-2 text-xs font-bold transition-all hover:underline"
        style={{ color: 'var(--primary-container)' }}
      >
        Ver log completo
      </button>
    </div>
  );
}

/**
 * StorageCard — navy storage summary card.
 * Stitch design: primary-container bg, big number, health bar with glow
 */
function StorageCard() {
  const { data: stats } = useClusterStats();

  if (!stats || stats.totalStorage <= 0) return null;

  const usedGB = (stats.usedStorage / (1024 * 1024 * 1024)).toFixed(1);
  const totalGB = Math.round(stats.totalStorage / (1024 * 1024 * 1024));
  const pct = Math.round((stats.usedStorage / stats.totalStorage) * 100);
  const freeGB = ((stats.totalStorage - stats.usedStorage) / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <div
      className="p-6 rounded-xl overflow-hidden relative group"
      style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)' }}
    >
      {/* Decorative bg icon */}
      <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform duration-500 group-hover:scale-110">
        <HardDrive size={96} />
      </div>

      <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Armazenamento</p>

      <div className="flex items-end gap-1 mb-4">
        <span className="text-3xl font-black font-display text-white">{usedGB}</span>
        <span className="text-lg font-bold mb-1">GB</span>
        <span className="text-xs opacity-60 mb-1.5 ml-1">/ {totalGB}GB</span>
      </div>

      {/* Health bar */}
      <div
        className="h-2 w-full rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: 'rgba(102, 132, 185, 0.2)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: 'var(--tertiary-fixed)',
            boxShadow: '0 0 8px rgba(111, 251, 190, 0.4)',
          }}
        />
      </div>

      <p className="text-[10px] font-medium">
        Você ainda possui {freeGB}GB disponíveis.
      </p>
    </div>
  );
}
