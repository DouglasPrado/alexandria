"use client";

import { useEffect, useState } from "react";
import { api, type AlertItem } from "@/lib/api";

const CLUSTER_ID = process.env.NEXT_PUBLIC_CLUSTER_ID ?? "";

function severityStyle(severity: string): string {
  switch (severity) {
    case "critical": return "border-l-error bg-error/5";
    case "warning": return "border-l-warning bg-warning/5";
    default: return "border-l-info bg-info/5";
  }
}

function severityBadge(severity: string): string {
  switch (severity) {
    case "critical": return "bg-error/10 text-error";
    case "warning": return "bg-warning/10 text-warning";
    default: return "bg-info/10 text-info";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  return `${Math.floor(hours / 24)}d atras`;
}

export default function HealthPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLUSTER_ID) {
      setError("NEXT_PUBLIC_CLUSTER_ID nao configurado");
      setLoading(false);
      return;
    }
    api
      .listAlerts(CLUSTER_ID)
      .then(setAlerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text mb-6">Saude do Cluster</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-surface-elevated border border-border rounded-lg text-center">
          <p className="text-3xl font-bold text-text">{alerts.length}</p>
          <p className="text-xs text-text-muted mt-1">Alertas Ativos</p>
        </div>
        <div className="p-4 bg-surface-elevated border border-border rounded-lg text-center">
          <p className="text-3xl font-bold text-error">{critical}</p>
          <p className="text-xs text-text-muted mt-1">Criticos</p>
        </div>
        <div className="p-4 bg-surface-elevated border border-border rounded-lg text-center">
          <p className="text-3xl font-bold text-warning">{warning}</p>
          <p className="text-xs text-text-muted mt-1">Avisos</p>
        </div>
      </div>

      {loading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 bg-border/50 rounded-lg animate-pulse" />
      ))}</div>}

      {error && <div className="p-4 bg-error/10 text-error rounded-lg">{error}</div>}

      {!loading && !error && alerts.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-lg font-medium">Cluster saudavel</p>
          <p className="text-sm mt-1">Nenhum alerta ativo</p>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 rounded-lg ${severityStyle(alert.severity)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${severityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs text-text-muted font-mono">{alert.alert_type}</span>
                </div>
                <span className="text-xs text-text-muted">{timeAgo(alert.created_at)}</span>
              </div>
              <p className="text-sm text-text mt-2">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
