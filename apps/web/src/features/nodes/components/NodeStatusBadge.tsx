/**
 * NodeStatusBadge — badge colorido por status do nó.
 * Fonte: docs/frontend/web/04-components.md (NodeStatusBadge)
 *
 * online → verde, suspect → amarelo, lost → vermelho, draining → azul, disconnected → cinza
 */
import type { NodeStatus } from '../types/node.types';

const STATUS_CONFIG: Record<NodeStatus, { label: string; className: string }> = {
  online: { label: 'Online', className: 'bg-[var(--success)] text-white' },
  suspect: { label: 'Suspect', className: 'bg-[var(--warning)] text-[var(--warning-foreground)]' },
  lost: { label: 'Lost', className: 'bg-[var(--destructive)] text-white' },
  draining: { label: 'Draining', className: 'bg-[var(--info)] text-white' },
  disconnected: { label: 'Desconectado', className: 'bg-[var(--muted)] text-[var(--muted-foreground)]' },
};

interface NodeStatusBadgeProps {
  status: NodeStatus;
}

export function NodeStatusBadge({ status }: NodeStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.disconnected;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
