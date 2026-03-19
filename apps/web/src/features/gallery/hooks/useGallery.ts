"use client";

import { useQuery } from "@tanstack/react-query";
import { getFiles } from "../api/gallery-api";

export function useGallery(clusterId: string | undefined) {
  return useQuery({
    queryKey: ["gallery", clusterId],
    queryFn: () => getFiles(clusterId!),
    enabled: !!clusterId,
    staleTime: 10 * 60 * 1000,
  });
}
