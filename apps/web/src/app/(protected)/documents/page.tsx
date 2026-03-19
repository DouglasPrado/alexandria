"use client";

import { useEffect, useState } from "react";
import { useCluster } from "@/hooks/useCluster";

interface DocItem {
  id: string;
  original_name: string;
  file_extension: string;
  original_size: number;
  created_at: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const extIcon: Record<string, string> = {
  pdf: "📕", doc: "📘", docx: "📘", xls: "📊", xlsx: "📊",
  ppt: "📙", pptx: "📙", txt: "📝", csv: "📊", zip: "📦",
};

export default function DocumentsPage() {
  const { cluster, loading: clusterLoading } = useCluster();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clusterLoading || !cluster) return;
    fetch(`/api/v1/clusters/${cluster.id}/files/search?media_type=documento&limit=100`)
      .then((r) => r.json())
      .then((data) => setDocs(data.files ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cluster, clusterLoading]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text mb-6">Documentos</h2>

      {(loading || clusterLoading) && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-border/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">📄</p>
          <p className="text-lg font-medium">Nenhum documento</p>
          <p className="text-sm mt-1">Envie PDFs, planilhas e outros documentos</p>
        </div>
      )}

      {!loading && docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc) => (
            <a
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-center gap-3 p-3 bg-surface-elevated border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <span className="text-2xl">{extIcon[doc.file_extension] ?? "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{doc.original_name}</p>
                <p className="text-xs text-text-muted">
                  {formatSize(doc.original_size)} · {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="text-xs text-text-muted uppercase">{doc.file_extension}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
