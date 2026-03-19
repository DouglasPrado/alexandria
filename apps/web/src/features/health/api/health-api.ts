import { apiClient } from "@/services/api-client";
import { AlertSchema, type AlertDTO } from "../types/health.types";
import { z } from "zod";

export async function getAlerts(clusterId: string): Promise<AlertDTO[]> {
  const raw = await apiClient.get(`/api/v1/clusters/${clusterId}/alerts`);
  return z.array(AlertSchema).parse(raw);
}
