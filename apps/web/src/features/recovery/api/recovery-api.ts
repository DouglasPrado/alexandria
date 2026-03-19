import { apiClient } from "@/services/api-client";
import { RecoveryReportSchema, type RecoveryReportDTO } from "../types/recovery.types";

export async function startRecovery(seedPhrase: string): Promise<RecoveryReportDTO> {
  const raw = await apiClient.post("/api/v1/recovery", { seed_phrase: seedPhrase });
  return RecoveryReportSchema.parse(raw);
}
