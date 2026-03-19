import { useQuery } from "@tanstack/react-query";
import { validateInvite } from "../api/auth-api";

export function useValidateInvite(token: string) {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: () => validateInvite(token),
    enabled: !!token,
    retry: false,
  });
}
