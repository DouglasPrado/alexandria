"use client";

import { useEffect, useState } from "react";
import { api, type FileItem } from "@/lib/api";
import { useCluster } from "@/lib/useCluster";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  return `${Math.floor(hours / 24)}d atras`;
}

export default function GalleryPage() {
  const { cluster, loading: clusterLoading, needsSetup } = useCluster();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");

  useEffect(() => {
    if (clusterLoading || !cluster) return;
    api
      .listFiles(cluster.id)
      .then((res) => setFiles(res.files))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cluster, clusterLoading]);

  const handleSearch = () => {
    if (!cluster) return;
    setLoading(true);
    const hasFilters = searchQuery || mediaFilter;
    const fetcher = hasFilters
      ? api.searchFiles(cluster.id, { q: searchQuery || undefined, media_type: mediaFilter || undefined })
          .then((res) => setFiles(res.files))
      : api.listFiles(cluster.id).then((res) => setFiles(res.files));
    fetcher
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (needsSetup) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🏠</p>
        <p className="text-lg font-medium text-text">Nenhum cluster configurado</p>
        <p className="text-sm text-text-muted mt-1 mb-4">Crie um cluster para comecar</p>
        <a href="/recovery" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
          Configurar
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-text">Galeria</h2>
        <a
          href="/upload"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Enviar Arquivos
        </a>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar por nome..."
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <select
          value={mediaFilter}
          onChange={(e) => { setMediaFilter(e.target.value); }}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text"
        >
          <option value="">Todos</option>
          <option value="foto">Fotos</option>
          <option value="video">Videos</option>
          <option value="documento">Documentos</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Buscar
        </button>
      </div>

      {(loading || clusterLoading) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-border/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-error/10 text-error rounded-lg">{error}</div>
      )}

      {!loading && !clusterLoading && !error && files.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">📷</p>
          <p className="text-lg font-medium">Nenhum arquivo ainda</p>
          <p className="text-sm mt-1">Envie fotos e videos para comecar</p>
        </div>
      )}

      {!loading && files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative aspect-square bg-surface-elevated border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="absolute inset-0 flex items-center justify-center text-4xl text-text-muted">
                {file.media_type === "foto" ? "🖼" : file.media_type === "video" ? "🎬" : "📄"}
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-xs font-medium truncate">
                  {file.original_name}
                </p>
                <p className="text-white/70 text-xs">
                  {formatSize(file.original_size)} · {timeAgo(file.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
