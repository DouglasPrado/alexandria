"use client";

import { useAuthStore } from "@/store/auth-store";

export function useCluster() {
  const member = useAuthStore((s) => s.member);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // cluster_id comes directly from the auth store (set at login/setup)
  const cluster = member?.cluster_id
    ? { id: member.cluster_id, name: "" }
    : null;

  return {
    cluster,
    loading: false,
    error: null,
    needsSetup: isAuthenticated && !cluster,
  };
}
