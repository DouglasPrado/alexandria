"use client";

import { useEffect, useState } from "react";
import { api, type ClusterItem } from "./api";

/**
 * Hook que auto-detecta o cluster ativo.
 * 1. Tenta NEXT_PUBLIC_CLUSTER_ID (env var)
 * 2. Senao, busca GET /api/v1/clusters e usa o primeiro
 * 3. Se nenhum cluster existe, retorna null (usuario precisa criar)
 */
export function useCluster() {
  const [cluster, setCluster] = useState<ClusterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const envId = process.env.NEXT_PUBLIC_CLUSTER_ID;

    api
      .listClusters()
      .then((clusters) => {
        if (envId) {
          const found = clusters.find((c) => c.id === envId);
          if (found) {
            setCluster(found);
            return;
          }
        }
        if (clusters.length > 0) {
          setCluster(clusters[0]);
        } else {
          setNeedsSetup(true);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { cluster, loading, error, needsSetup };
}
