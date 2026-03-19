"use client";

import { useParams } from "next/navigation";

export default function MemberDetailPage() {
  const params = useParams();
  const memberId = params.memberId as string;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text mb-6">Detalhe do Membro</h2>
      <p className="text-sm text-text-muted font-mono">{memberId}</p>
      <p className="text-sm text-text-muted mt-2">Detalhes, audit log e permissoes do membro.</p>
    </div>
  );
}
