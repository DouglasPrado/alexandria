import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteMember } from "../api/members-api";

export function useInviteMember(clusterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) => inviteMember(clusterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", clusterId] });
    },
  });
}
