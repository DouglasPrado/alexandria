"use client";

import { useParams } from "next/navigation";

export default function DocumentDetailPage() {
  const params = useParams();
  const fileId = params.fileId as string;

  // Redireciona para a pagina de detalhe do arquivo na galeria (mesma logica)
  return (
    <div>
      <a href="/documents" className="text-sm text-primary hover:underline mb-4 inline-block">← Voltar</a>
      <h2 className="text-2xl font-semibold text-text mb-4">Documento</h2>
      <p className="text-sm text-text-muted font-mono mb-4">{fileId}</p>
      <a href={`/gallery/${fileId}`} className="text-sm text-primary hover:underline">
        Ver detalhes completos
      </a>
    </div>
  );
}
