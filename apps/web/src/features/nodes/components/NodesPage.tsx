"use client";

import { HardDrive } from "lucide-react";
import { useCluster } from "@/hooks/useCluster";
import { Skeleton, Alert } from "@/components/ui";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Header } from "@/components/layouts/Header";
import { useNodes } from "../hooks/useNodes";
import { NodeList } from "./NodeList";

export function NodesPage() {
  const { cluster, loading: clusterLoading } = useCluster();
  const { data: nodes, isLoading, error } = useNodes(cluster?.id);

  const loading = clusterLoading || isLoading;

  return (
    <div>
      <Header title="Nos de Armazenamento" />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {error && <Alert variant="error">{error.message}</Alert>}

      {!loading && !error && nodes && nodes.length === 0 && (
        <EmptyState
          icon={HardDrive}
          title="Nenhum no registrado"
          description="Registre nos para armazenar dados da familia"
        />
      )}

      {!loading && nodes && nodes.length > 0 && <NodeList nodes={nodes} />}
    </div>
  );
}
