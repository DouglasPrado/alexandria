import { apiClient } from "@/services/api-client";
import { NodeSchema, type NodeDTO } from "../types/nodes.types";
import { z } from "zod";

export async function getNodes(clusterId: string): Promise<NodeDTO[]> {
  const raw = await apiClient.get(`/api/v1/clusters/${clusterId}/nodes`);
  return z.array(NodeSchema).parse(raw);
}
