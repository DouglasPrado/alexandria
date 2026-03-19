"use client";

import { useEffect, useState } from "react";
import { api, type NodeItem } from "@/lib/api";
import { useCluster } from "@/lib/useCluster";

function formatCapacity(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function statusColor(status: string): string {
  switch (status) {
    case "online": return "bg-success/10 text-success";
    case "suspect": return "bg-warning/10 text-warning";
    case "lost": return "bg-error/10 text-error";
    case "draining": return "bg-info/10 text-info";
    default: return "bg-border text-text-muted";
  }
}

export default function NodesPage() {
  const { cluster, loading: clusterLoading } = useCluster();
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clusterLoading || !cluster) return;
    api
      .listNodes(cluster.id)
      .then(setNodes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cluster, clusterLoading]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text mb-6">Nos de Armazenamento</h2>

      {loading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 bg-border/50 rounded-lg animate-pulse" />
      ))}</div>}

      {error && <div className="p-4 bg-error/10 text-error rounded-lg">{error}</div>}

      {!loading && !error && nodes.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">💾</p>
          <p className="text-lg font-medium">Nenhum no registrado</p>
          <p className="text-sm mt-1">Registre nos para armazenar dados da familia</p>
        </div>
      )}

      {!loading && nodes.length > 0 && (
        <div className="space-y-3">
          {nodes.map((node) => {
            const usedPct = node.total_capacity > 0
              ? (node.used_capacity / node.total_capacity) * 100
              : 0;
            return (
              <div
                key={node.id}
                className="p-4 bg-surface-elevated border border-border rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-text">{node.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor(node.status)}`}>
                      {node.status}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted font-mono">{node.node_type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(usedPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatCapacity(node.used_capacity)} / {formatCapacity(node.total_capacity)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
