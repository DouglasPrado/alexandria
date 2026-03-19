import { useQuery } from "@tanstack/react-query";
import { getMembers } from "../api/members-api";

export function useMembers(clusterId: string) {
  return useQuery({
    queryKey: ["members", clusterId],
    queryFn: () => getMembers(clusterId),
    enabled: !!clusterId,
  });
}
