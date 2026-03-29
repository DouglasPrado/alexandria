'use client';

import { useAlerts, useResolveAlert } from '../hooks/useAlerts';
import { toast } from 'sonner';

/**
 * AlertDropdown — lista de alertas ativos com acao de resolver.
 * Fonte: docs/frontend/web/04-components.md (AlertDropdown)
 */

const severityStyles: Record<string, string> = {
  critical: 'border-l-destructive bg-destructive/5',
  warning: 'border-l-warning bg-warning/5',
  info: 'border-l-info bg-info/5',
};

export function AlertDropdown({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useAlerts(false);
  const resolveAlert = useResolveAlert();

  const alerts = data?.data ?? [];

  const handleResolve = (alertId: string) => {
    resolveAlert.mutate(alertId, {
      onSuccess: () => toast.success('Alerta resolvido'),
      onError: () => toast.error('Falha ao resolver alerta'),
    });
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Alertas ativos</h3>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando...</div>
        )}
        {!isLoading && alerts.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum alerta ativo
          </div>
        )}
        {alerts.map((alert: any) => (
          <div
            key={alert.id}
            className={`border-l-4 px-4 py-3 ${severityStyles[alert.severity] ?? ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{alert.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(alert.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => handleResolve(alert.id)}
                className="ml-2 text-xs text-primary hover:underline"
                disabled={resolveAlert.isPending}
              >
                Resolver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
