"use client";

import { useParams } from "next/navigation";

export default function NodeDetailPage() {
  const params = useParams();
  const nodeId = params.nodeId as string;

  return (
    <div>
      <a href="/nodes" className="text-sm text-primary hover:underline mb-4 inline-block">← Voltar</a>
      <h2 className="text-2xl font-semibold text-text mb-4">Detalhe do No</h2>
      <p className="text-sm text-text-muted font-mono mb-4">{nodeId}</p>
      <p className="text-sm text-text-muted">Chunks armazenados, capacidade, heartbeat e opcao de drain.</p>
    </div>
  );
}
