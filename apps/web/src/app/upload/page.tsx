"use client";

import { useCallback, useState } from "react";
import { api, type UploadResponse } from "@/lib/api";
import { useCluster } from "@/lib/useCluster";

function getMediaType(mime: string): string {
  if (mime.startsWith("image/")) return "foto";
  if (mime.startsWith("video/")) return "video";
  return "documento";
}

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

interface UploadItem {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  result?: UploadResponse;
  error?: string;
}

export default function UploadPage() {
  const { cluster } = useCluster();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((fileList: FileList) => {
    const newItems: UploadItem[] = Array.from(fileList).map((f) => ({
      file: f,
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const uploadAll = useCallback(async () => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "pending") continue;

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "uploading" } : item
        )
      );

      try {
        const file = items[i].file;
        const result = await api.uploadFile({
          cluster_id: cluster?.id ?? "",
          uploaded_by: "00000000-0000-0000-0000-000000000000",
          original_name: file.name,
          media_type: getMediaType(file.type),
          mime_type: file.type || "application/octet-stream",
          file_extension: getExtension(file.name),
          original_size: file.size,
        });

        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "done", result } : item
          )
        );
      } catch (e) {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: "error", error: (e as Error).message }
              : item
          )
        );
      }
    }
  }, [items, cluster]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text mb-6">Enviar Arquivos</h2>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <p className="text-4xl mb-3">📤</p>
        <p className="text-text font-medium">Arraste arquivos aqui</p>
        <p className="text-text-muted text-sm mt-1">ou clique para selecionar</p>
        <input
          type="file"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ position: "relative" }}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Queue */}
      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-text">
              {items.length} arquivo(s) selecionado(s)
            </p>
            <button
              onClick={uploadAll}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              Enviar Todos
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-surface-elevated border border-border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{item.file.name}</p>
                  <p className="text-xs text-text-muted">
                    {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    item.status === "pending" ? "bg-border text-text-muted" :
                    item.status === "uploading" ? "bg-info/10 text-info" :
                    item.status === "done" ? "bg-success/10 text-success" :
                    "bg-error/10 text-error"
                  }`}
                >
                  {item.status === "pending" && "Pendente"}
                  {item.status === "uploading" && "Enviando..."}
                  {item.status === "done" && "Concluido"}
                  {item.status === "error" && item.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
