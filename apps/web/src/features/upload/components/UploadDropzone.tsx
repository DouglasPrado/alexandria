"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";

interface UploadDropzoneProps {
  onFiles: (files: FileList) => void;
}

export function UploadDropzone({ onFiles }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
    >
      <Upload className="mx-auto h-10 w-10 text-text-muted/50 mb-3" />
      <p className="text-text font-medium">Arraste arquivos aqui</p>
      <p className="text-text-muted text-sm mt-1">ou clique para selecionar</p>
      <input
        type="file"
        multiple
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
    </div>
  );
}
