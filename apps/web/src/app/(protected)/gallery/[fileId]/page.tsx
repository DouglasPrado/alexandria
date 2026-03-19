"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface FileDetail {
  id: string;
  original_name: string;
  media_type: string;
  mime_type: string;
  file_extension: string;
  original_size: number;
  optimized_size: number;
  status: string;
  created_at: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDetailPage() {
  const params = useParams();
  const fileId = params.fileId as string;
  const [file, setFile] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/files/${fileId}`)
      .then((r) => r.json())
      .then(setFile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fileId]);

  if (loading) return <div className="animate-pulse h-60 bg-border/50 rounded-lg" />;
  if (!file) return <p className="text-error">Arquivo nao encontrado</p>;

  return (
    <div>
      <a href="/gallery" className="text-sm text-primary hover:underline mb-4 inline-block">← Voltar</a>
      <h2 className="text-2xl font-semibold text-text mb-4">{file.original_name}</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Preview area */}
        <div className="aspect-video bg-surface-elevated border border-border rounded-lg flex items-center justify-center text-6xl text-text-muted">
          {file.media_type === "foto" ? "🖼" : file.media_type === "video" ? "🎬" : "📄"}
        </div>

        {/* Metadata */}
        <div className="p-4 bg-surface-elevated border border-border rounded-lg space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Tipo</span>
            <span className="text-text">{file.media_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">MIME</span>
            <span className="text-text font-mono text-xs">{file.mime_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Tamanho original</span>
            <span className="text-text">{formatSize(file.original_size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Tamanho otimizado</span>
            <span className="text-text">{formatSize(file.optimized_size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Status</span>
            <span className={`font-medium ${file.status === "ready" ? "text-success" : "text-warning"}`}>
              {file.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Criado em</span>
            <span className="text-text">{new Date(file.created_at).toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <a
          href={`/api/v1/files/${fileId}/download`}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Download
        </a>
        <a
          href={`/api/v1/files/${fileId}/versions`}
          className="px-4 py-2 border border-border text-text rounded-lg text-sm font-medium hover:bg-surface"
        >
          Versoes
        </a>
      </div>
    </div>
  );
}
