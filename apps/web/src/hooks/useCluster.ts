"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { z } from "zod";

const ClusterSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  name: z.string(),
  created_at: z.string(),
});
type ClusterDTO = z.infer<typeof ClusterSchema>;

async function getClusters(): Promise<ClusterDTO[]> {
  const raw = await apiClient.get("/api/v1/clusters");
  return z.array(ClusterSchema).parse(raw);
}

export function useCluster() {
  const envId = process.env.NEXT_PUBLIC_CLUSTER_ID;

  const { data: clusters, isLoading, error } = useQuery({
    queryKey: ["clusters"],
    queryFn: getClusters,
    staleTime: 5 * 60 * 1000,
    enabled: !envId,
  });

  const cluster = envId
    ? { id: envId, cluster_id: envId, name: "", created_at: "" }
    : clusters?.[0] ?? null;

  return {
    cluster,
    loading: !envId && isLoading,
    error: error?.message ?? null,
    needsSetup: !envId && !isLoading && !cluster,
  };
}
