import { useMutation } from "@tanstack/react-query";
import { login } from "../api/auth-api";
import { useAuthStore } from "@/store/auth-store";

export function useLogin() {
  const authLogin = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (data) => {
      authLogin({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        member: data.member,
      });
    },
  });
}
