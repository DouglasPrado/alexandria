import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MemberInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  cluster_id: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  member: MemberInfo | null;
  isAuthenticated: boolean;
  login: (data: {
    access_token: string;
    refresh_token: string;
    member: MemberInfo;
  }) => void;
  logout: () => void;
  updateTokens: (data: {
    access_token: string;
    refresh_token: string;
  }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      member: null,
      isAuthenticated: false,
      login: (data) =>
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          member: data.member,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          member: null,
          isAuthenticated: false,
        }),
      updateTokens: (data) =>
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        }),
    }),
    { name: "alexandria-auth" },
  ),
);
