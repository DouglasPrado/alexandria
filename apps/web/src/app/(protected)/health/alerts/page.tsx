"use client";

import { useEffect, useState } from "react";
import { useCluster } from "@/hooks/useCluster";

interface AlertItem {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string;
}

export default function AlertsPage() {
  const { cluster, loading: clusterLoading } = useCluster();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clusterLoading || !cluster) return;
    fetch(`/api/v1/clusters/${cluster.id}/alerts`)
      .then((r) => r.json())
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cluster, clusterLoading]);

  const severityColor = (s: string) => {
    switch (s) {
      case "critical": return "border-l-error bg-error/5";
      case "warning": return "border-l-warning bg-warning/5";
      default: return "border-l-info bg-info/5";
    }
  };

  return (
    <div>
      <a href="/health" className="text-sm text-primary hover:underline mb-4 inline-block">← Dashboard</a>
      <h2 className="text-2xl font-semibold text-text mb-6">Historico de Alertas</h2>

      {(loading || clusterLoading) && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-border/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-lg font-medium">Nenhum alerta</p>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`p-4 border-l-4 rounded-lg ${severityColor(a.severity)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-muted font-mono">{a.alert_type}</span>
                <span className="text-xs text-text-muted">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-sm text-text">{a.message}</p>
              {a.resource_type && (
                <p className="text-xs text-text-muted mt-1">{a.resource_type}: {a.resource_id}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
