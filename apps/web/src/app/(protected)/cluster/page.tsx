"use client";

import { useEffect, useState } from "react";
import { useCluster } from "@/hooks/useCluster";

export default function ClusterPage() {
  const { cluster, loading } = useCluster();

  if (loading) return <div className="animate-pulse h-40 bg-border/50 rounded-lg" />;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text mb-6">Gerenciar Cluster</h2>

      {cluster && (
        <div className="space-y-4">
          <div className="p-4 bg-surface-elevated border border-border rounded-lg">
            <h3 className="font-medium text-text mb-2">Informacoes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Nome</span>
                <span className="text-text font-medium">{cluster.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">ID</span>
                <span className="text-text font-mono text-xs">{cluster.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Criado em</span>
                <span className="text-text">{new Date(cluster.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <a href="/cluster/members" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
              Gerenciar Membros
            </a>
            <a href="/cluster/invite" className="px-4 py-2 border border-border text-text rounded-lg text-sm font-medium hover:bg-surface">
              Convidar Membro
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
