'use client';

import type { NodeTier } from '../types/node.types';

const TIER_STYLES: Record<NodeTier, string> = {
  hot:  'bg-destructive/10 text-destructive border-destructive/20',
  warm: 'bg-warning/10 text-warning border-warning/20',
  cold: 'bg-info/10 text-info border-info/20',
};

const TIER_LABELS: Record<NodeTier, string> = {
  hot:  'Hot',
  warm: 'Warm',
  cold: 'Cold',
};

/**
 * TierBadge — exibe o tier de armazenamento de um nó.
 * hot = rápido/caro, warm = padrão, cold = lento/barato.
 * Fonte: docs/blueprint/11-build_plan.md (Fase 2 — Tiered storage)
 */
export function TierBadge({ tier }: { tier: NodeTier }) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.warm;
  const label = TIER_LABELS[tier] ?? tier;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
}
