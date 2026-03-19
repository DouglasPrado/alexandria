"use client";

import { useMutation } from "@tanstack/react-query";
import { startRecovery } from "../api/recovery-api";

export function useRecovery() {
  return useMutation({
    mutationFn: startRecovery,
  });
}
