import { z } from "zod";

export const RecoveryReportSchema = z.object({
  seed_valid: z.boolean(),
  master_key_derived: z.boolean(),
  vaults_recovered: z.number(),
  manifests_found: z.number(),
  files_recovered: z.number(),
  chunks_missing: z.number(),
  nodes_reconnected: z.number(),
  status: z.string(),
});
export type RecoveryReportDTO = z.infer<typeof RecoveryReportSchema>;
