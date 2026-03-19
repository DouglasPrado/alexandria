"use client";

import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "../api/health-api";

export function useAlerts(clusterId: string | undefined) {
  return useQuery({
    queryKey: ["alerts", clusterId],
    queryFn: () => getAlerts(clusterId!),
    enabled: !!clusterId,
    staleTime: 30 * 1000,
  });
}
