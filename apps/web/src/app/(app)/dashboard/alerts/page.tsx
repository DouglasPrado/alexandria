/**
 * Alerts Dashboard — Central de Alertas e Notificações.
 * Fonte: docs/frontend/web/04-components.md (AlertList)
 * Design: Stitch — Central de Alertas (feed com status stripe, bento metrics)
 *
 * Visível apenas para admins (sidebar filtra por role).
 */
'use client';

import { useState } from 'react';
import { useAlerts, useResolveAlert } from '@/features/alerts';
import type { AlertFilter, AlertDTO } from '@/features/alerts';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Search,
  Zap,
  Loader2,
  MoreVertical,
} from 'lucide-react';

const severityConfig = {
  critical: {
    icon: XCircle,
    stripe: 'var(--destructive)',
    iconBg: 'rgba(186, 26, 26, 0.12)',
    iconColor: 'var(--destructive)',
    label: 'Security Priority',
    labelColor: 'var(--destructive)',
  },
  warning: {
    icon: AlertTriangle,
    stripe: 'var(--success)',
    iconBg: 'rgba(111, 251, 190, 0.3)',
    iconColor: 'var(--success)',
    label: 'System Status',
    labelColor: 'var(--success)',
  },
  info: {
    icon: Info,
    stripe: 'var(--surface-tint)',
    iconBg: 'var(--secondary-container)',
    iconColor: 'var(--surface-tint)',
    label: 'File Activity',
    labelColor: 'var(--surface-tint)',
  },
} as const;

const alertTypeLabels: Record<string, string> = {
  node_offline: 'Nó offline',
  replication_low: 'Replicação baixa',
  corruption_detected: 'Corrupção detectada',
  auto_healing_complete: 'Auto-healing concluído',
  space_low: 'Espaço insuficiente',
  token_expired: 'Token expirado',
};

const filterOptions: { value: AlertFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'resolved', label: 'Resolvidos' },
];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<AlertFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const resolved = filter === 'all' ? undefined : filter === 'resolved';
  const { data: alertsResponse, isLoading, error } = useAlerts(resolved);
  const resolveAlert = useResolveAlert();

  // Backend may return { data: AlertDTO[] } or AlertDTO[] directly
  const alerts: AlertDTO[] | undefined = Array.isArray(alertsResponse)
    ? alertsResponse
    : (alertsResponse as unknown as { data?: AlertDTO[] } | undefined)?.data;

  const unresolvedCount = alerts?.filter((a) => !a.resolved).length ?? 0;

  const filteredAlerts = alerts?.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.message.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <span
            className="text-xs font-bold uppercase tracking-[0.2em] mb-2 block font-display"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Central Management
          </span>
          <h1
            className="text-4xl font-extrabold font-display tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Central de Alertas
          </h1>
        </div>
        <div
          className="flex items-center p-1 rounded-lg"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-6 py-2 text-sm font-semibold rounded transition-all"
              style={
                filter === opt.value
                  ? {
                      backgroundColor: 'var(--surface-container-lowest)',
                      color: 'var(--sidebar-active-text)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bento: Search + Unresolved count */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* Search + tags (3 cols) */}
        <div
          className="md:col-span-3 p-6 rounded-xl flex flex-col justify-between"
          style={{ backgroundColor: 'var(--surface-container-low)' }}
        >
          <div className="relative w-full">
            <Search
              size={22}
              className="absolute left-0 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--primary-container)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar alertas por palavra-chave, nó ou tipo..."
              className="w-full bg-transparent border-0 border-b-2 focus:ring-0 text-xl font-display py-4 pl-10"
              style={{
                borderColor: 'rgba(64, 95, 145, 0.2)',
                color: 'var(--foreground)',
              }}
            />
          </div>
          <div className="flex gap-4 mt-6">
            {['#security', '#storage', '#activity'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded text-xs font-bold cursor-pointer transition-all"
                style={{
                  backgroundColor: 'var(--surface-container-highest)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Unresolved count card (1 col) */}
        <div
          className="p-6 rounded-xl text-white flex flex-col justify-between"
          style={{ backgroundColor: 'var(--primary-container)' }}
        >
          <Zap size={28} style={{ color: 'var(--tertiary-fixed)' }} />
          <div>
            <div className="text-4xl font-display font-black leading-none">
              {unresolvedCount}
            </div>
            <div
              className="text-[10px] uppercase tracking-widest font-bold mt-1"
              style={{ color: 'var(--on-primary-container)' }}
            >
              Alertas não resolvidos
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16" style={{ color: 'var(--muted-foreground)' }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-3" />
          Carregando alertas...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16" style={{ color: 'var(--destructive)' }}>
          Erro ao carregar alertas.
        </div>
      )}

      {/* Empty state */}
      {filteredAlerts && filteredAlerts.length === 0 && (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(111, 251, 190, 0.15)' }}
          >
            <CheckCircle size={28} style={{ color: 'var(--success)' }} />
          </div>
          <h3 className="font-display font-bold text-lg" style={{ color: 'var(--foreground)' }}>
            Tudo limpo
          </h3>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {filter === 'active' ? 'Nenhum alerta ativo. Cluster saudável.' : 'Nenhum alerta encontrado.'}
          </p>
        </div>
      )}

      {/* Alerts Feed */}
      {filteredAlerts && filteredAlerts.length > 0 && (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const Icon = config.icon;
            const isResolved = alert.resolved;

            return (
              <div
                key={alert.id}
                className="flex items-stretch min-h-[100px] transition-all hover:translate-x-1"
                style={{
                  backgroundColor: 'var(--surface-container-lowest)',
                  opacity: isResolved ? 0.7 : 1,
                }}
              >
                {/* Status stripe */}
                <div
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: config.stripe }}
                />

                {/* Content */}
                <div className="flex-grow p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex gap-5 items-start">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: config.iconBg, color: config.iconColor }}
                    >
                      <Icon size={22} />
                    </div>

                    {/* Text */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-black uppercase tracking-tighter"
                          style={{ color: config.labelColor }}
                        >
                          {config.label}
                        </span>
                        <span
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: 'var(--outline-variant)' }}
                        />
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {formatRelativeTime(alert.createdAt)}
                        </span>
                      </div>
                      <h3
                        className="text-lg font-bold leading-tight"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {alertTypeLabels[alert.type] || alert.type}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        {alert.message}
                      </p>
                      {alert.resolvedAt && (
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          Resolvido em {new Date(alert.resolvedAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 shrink-0">
                    {!isResolved && (
                      <button
                        onClick={() => resolveAlert.mutate(alert.id)}
                        disabled={resolveAlert.isPending}
                        className="px-4 py-2 text-xs font-bold rounded text-white transition-all active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--primary-container)' }}
                      >
                        Resolver
                      </button>
                    )}
                    <button
                      className="w-10 h-10 flex items-center justify-center rounded transition-colors"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {filteredAlerts && filteredAlerts.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            className="flex items-center gap-2 px-8 py-4 text-sm font-display font-bold rounded-full transition-all"
            style={{
              backgroundColor: 'var(--surface-container-low)',
              color: 'var(--foreground)',
            }}
          >
            Carregar histórico
          </button>
        </div>
      )}
    </div>
  );
}
