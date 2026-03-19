"use client";

import { useQuery } from "@tanstack/react-query";
import { getNodes } from "../api/nodes-api";

export function useNodes(clusterId: string | undefined) {
  return useQuery({
    queryKey: ["nodes", clusterId],
    queryFn: () => getNodes(clusterId!),
    enabled: !!clusterId,
    staleTime: 30 * 1000,
  });
}
