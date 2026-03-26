'use client';

import { useState } from 'react';
import { useAlerts, useResolveAlert } from '@/features/alerts';
import type { AlertFilter } from '@/features/alerts';
import { AlertTriangle, CheckCircle, Info, XCircle, Shield } from 'lucide-react';

/**
 * Alerts Dashboard — lista alertas do cluster com filtro e resolucao.
 * Fonte: docs/frontend/web/04-components.md (AlertList)
 * Fonte: docs/backend/05-api-contracts.md (GET /api/alerts)
 *
 * Visivel apenas para admins (sidebar filtra por role).
 */

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Critico' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Aviso' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Info' },
} as const;

const alertTypeLabels: Record<string, string> = {
  node_offline: 'No offline',
  replication_low: 'Replicacao baixa',
  corruption_detected: 'Corrupcao detectada',
  auto_healing_complete: 'Auto-healing concluido',
  space_low: 'Espaco insuficiente',
  token_expired: 'Token expirado',
};

const filterOptions: { value: AlertFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'resolved', label: 'Resolvidos' },
];

export default function AlertsPage() {
  const [filter, setFilter] = useState<AlertFilter>('active');

  const resolved = filter === 'all' ? undefined : filter === 'resolved';
  const { data: alerts, isLoading, error } = useAlerts(resolved);
  const resolveAlert = useResolveAlert();

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-[var(--foreground)]" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Alertas</h1>
        </div>

        <div className="flex gap-1 bg-[var(--muted)] rounded-lg p-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === opt.value
                  ? 'bg-[var(--background)] text-[var(--foreground)] font-medium shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-[var(--muted-foreground)]">Carregando alertas...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">Erro ao carregar alertas.</div>
      )}

      {alerts && alerts.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
          <p className="text-[var(--muted-foreground)]">
            {filter === 'active' ? 'Nenhum alerta ativo. Cluster saudavel.' : 'Nenhum alerta encontrado.'}
          </p>
        </div>
      )}

      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${config.bg} ${config.border} ${
                  alert.resolved ? 'opacity-60' : ''
                }`}
              >
                <Icon size={20} className={`mt-0.5 shrink-0 ${config.color}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {alertTypeLabels[alert.type] || alert.type}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--foreground)]">{alert.message}</p>

                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {new Date(alert.createdAt).toLocaleString('pt-BR')}
                    {alert.resolvedAt && (
                      <> — resolvido em {new Date(alert.resolvedAt).toLocaleString('pt-BR')}</>
                    )}
                  </p>
                </div>

                {!alert.resolved && (
                  <button
                    onClick={() => resolveAlert.mutate(alert.id)}
                    disabled={resolveAlert.isPending}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                  >
                    Resolver
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
