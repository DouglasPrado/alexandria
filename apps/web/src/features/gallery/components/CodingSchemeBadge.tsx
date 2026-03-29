/**
 * CodingSchemeBadge — indica o esquema de codificação de armazenamento do arquivo.
 * Fonte: docs/blueprint/11-build_plan.md (Fase 3 — Erasure coding 10+4)
 */

type CodingScheme = 'replication' | 'erasure';

const SCHEME_STYLES: Record<CodingScheme, string> = {
  replication: 'bg-info/10 text-info border-info/20',
  erasure:     'bg-primary/10 text-primary border-primary/20',
};

const SCHEME_LABEL: Record<CodingScheme, string> = {
  replication: 'Replicação 3×',
  erasure:     'Erasure RS(10,4)',
};

interface CodingSchemeBadgeProps {
  scheme: string;
}

export function CodingSchemeBadge({ scheme }: CodingSchemeBadgeProps) {
  const key = (scheme === 'erasure' ? 'erasure' : 'replication') as CodingScheme;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${SCHEME_STYLES[key]}`}
    >
      {SCHEME_LABEL[key]}
    </span>
  );
}
