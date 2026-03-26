/**
 * PDFViewer — leitor de PDF com scroll contínuo (todas as páginas), zoom e text layer.
 * Usa react-pdf (pdfjs-dist). Worker servido localmente via public/pdf.worker.min.mjs.
 * Fonte: docs/frontend/web/04-components.md (PDFViewer)
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker servido localmente (apps/web/public/pdf.worker.min.mjs)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
  downloadUrl: string;
  filename: string;
  initialPages?: number;
}

export function PDFViewer({ downloadUrl, filename, initialPages }: PDFViewerProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(initialPages ?? 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageWidth, setPageWidth] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch PDF como blob com cookies de auth
  useEffect(() => {
    let cancelled = false;
    setFetchError(null);
    setBlob(null);
    fetch(downloadUrl, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status} ao carregar PDF`);
        return res.blob();
      })
      .then((b) => { if (!cancelled) setBlob(b); })
      .catch((err: Error) => { if (!cancelled) setFetchError(err.message); });
    return () => { cancelled = true; };
  }, [downloadUrl]);

  // Adapta largura da página ao container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 700;
      setPageWidth(Math.max(320, w - 48));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // IntersectionObserver para atualizar indicador de página atual ao rolar
  useEffect(() => {
    if (!numPages || !containerRef.current) return;
    const pages = containerRef.current.querySelectorAll<HTMLElement>('[data-page-number]');
    if (!pages.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const n = parseInt((visible[0].target as HTMLElement).dataset.pageNumber ?? '1', 10);
          setCurrentPage(n);
        }
      },
      { root: containerRef.current, threshold: 0.3 },
    );

    pages.forEach((p) => obs.observe(p));
    return () => obs.disconnect();
  }, [numPages, scale]);

  const zoomIn = useCallback(() => setScale((s) => Math.min(3, parseFloat((s + 0.25).toFixed(2)))), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2)))), []);
  const resetZoom = useCallback(() => setScale(1.0), []);

  // Atalhos de teclado: +/- para zoom
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomIn, zoomOut, resetZoom]);

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-[var(--muted-foreground)] h-full">
        <AlertCircle size={40} className="text-[var(--destructive)]" />
        <p className="text-sm font-medium">Não foi possível carregar o PDF</p>
        <p className="text-xs opacity-60 text-center max-w-xs">{fetchError}</p>
      </div>
    );
  }

  if (!blob) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-[var(--muted-foreground)] h-full">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm">Carregando {filename}…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-sm border-b border-white/10 flex-shrink-0">

        {/* Contador de página */}
        <span className="text-xs text-white/50 tabular-nums">
          {numPages > 0 ? `${currentPage} / ${numPages}` : '…'}
        </span>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            aria-label="Diminuir zoom"
            className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomOut size={15} />
          </button>

          <button
            onClick={resetZoom}
            aria-label="Resetar zoom"
            className="text-xs text-white/60 hover:text-white/90 w-11 text-center transition-colors tabular-nums"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            aria-label="Aumentar zoom"
            className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn size={15} />
          </button>
        </div>

        {/* Placeholder para simetria */}
        <span className="w-14" />
      </div>

      {/* Scroll contínuo com todas as páginas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto min-h-0 py-4 px-6 flex flex-col items-center gap-3"
      >
        <Document
          file={blob}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={(err) => setFetchError(err.message)}
          loading={
            <div className="flex flex-col items-center gap-2 text-white/40 pt-16">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Renderizando…</span>
            </div>
          }
          className="flex flex-col items-center gap-3 w-full"
        >
          {numPages > 0 &&
            Array.from({ length: numPages }, (_, i) => (
              <div key={i + 1} data-page-number={i + 1} className="flex-shrink-0">
                <Page
                  pageNumber={i + 1}
                  width={pageWidth * scale}
                  renderTextLayer
                  renderAnnotationLayer
                  className="shadow-xl"
                  loading={
                    <div
                      style={{
                        width: pageWidth * scale,
                        height: (pageWidth * scale) * 1.414,
                      }}
                      className="bg-white/5 rounded animate-pulse"
                    />
                  }
                />
              </div>
            ))}
        </Document>
      </div>
    </div>
  );
}
