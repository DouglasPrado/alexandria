import { z } from "zod";

export const AlertSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  alert_type: z.string(),
  message: z.string(),
  severity: z.string(),
  resource_type: z.string().nullable(),
  resource_id: z.string().nullable(),
  created_at: z.string(),
});
export type AlertDTO = z.infer<typeof AlertSchema>;
