"use client";

import { useEffect, useState } from "react";
import { api, type FileItem } from "@/lib/api";

const CLUSTER_ID = process.env.NEXT_PUBLIC_CLUSTER_ID ?? "";

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
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLUSTER_ID) {
      setError("NEXT_PUBLIC_CLUSTER_ID nao configurado");
      setLoading(false);
      return;
    }
    api
      .listFiles(CLUSTER_ID)
      .then((res) => setFiles(res.files))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-text">Galeria</h2>
        <a
          href="/upload"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Enviar Arquivos
        </a>
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-border/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-error/10 text-error rounded-lg">{error}</div>
      )}

      {!loading && !error && files.length === 0 && (
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
