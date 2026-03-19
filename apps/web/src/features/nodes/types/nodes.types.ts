import { z } from "zod";

export const NodeSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  name: z.string(),
  node_type: z.string(),
  status: z.string(),
  total_capacity: z.number(),
  used_capacity: z.number(),
  last_heartbeat: z.string(),
});
export type NodeDTO = z.infer<typeof NodeSchema>;
