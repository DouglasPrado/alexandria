/**
 * UploadDropzone — área de drag-and-drop + botão de seleção de arquivos.
 * Fonte: docs/frontend/web/04-components.md (Feature: gallery)
 */
'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';


interface UploadDropzoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFiles, disabled }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles, disabled],
  );

  /**
   * Abre file picker programaticamente sem accept — garante que
   * macOS Finder mostra todos os arquivos como selecionaveis.
   * Validacao de MIME type fica no backend (whitelist).
   */
  const openFilePicker = useCallback(() => {
    if (disabled) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      if (files.length > 0) onFiles(files);
    };
    input.click();
  }, [onFiles, disabled]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={openFilePicker}
      role="button"
      aria-label="Selecionar arquivos para upload"
      className={`border-2 border-dashed rounded-[var(--radius)] p-10 text-center transition-colors cursor-pointer ${
        isDragging
          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
          : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--secondary)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Upload size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
      <p className="text-[var(--foreground)] font-medium">
        {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui ou clique para selecionar'}
      </p>
      <p className="text-sm text-[var(--muted-foreground)] mt-1">
        Fotos, vídeos, documentos e arquivos (ZIP, DMG) — até 10 GB por arquivo
      </p>
    </div>
  );
}
