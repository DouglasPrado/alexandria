"use client";

import { ShieldCheck } from "lucide-react";
import { useCluster } from "@/hooks/useCluster";
import { Skeleton, Alert } from "@/components/ui";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Header } from "@/components/layouts/Header";
import { useAlerts } from "../hooks/useAlerts";
import { HealthSummary } from "./HealthSummary";
import { AlertList } from "./AlertList";

export function HealthPage() {
  const { cluster, loading: clusterLoading } = useCluster();
  const { data: alerts, isLoading, error } = useAlerts(cluster?.id);

  const loading = clusterLoading || isLoading;

  return (
    <div>
      <Header title="Saude do Cluster" />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {error && <Alert variant="error">{error.message}</Alert>}

      {!loading && !error && alerts && (
        <>
          <HealthSummary alerts={alerts} />
          {alerts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Cluster saudavel"
              description="Nenhum alerta ativo"
            />
          ) : (
            <AlertList alerts={alerts} />
          )}
        </>
      )}
    </div>
  );
}
