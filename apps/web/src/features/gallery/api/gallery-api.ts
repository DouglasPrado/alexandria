import { apiClient } from "@/services/api-client";
import { GalleryResponseSchema, type GalleryResponse } from "../types/gallery.types";

export async function getFiles(
  clusterId: string,
  cursor?: string,
  limit = 20,
): Promise<GalleryResponse> {
  const params: Record<string, string> = { limit: String(limit) };
  if (cursor) params.cursor = cursor;
  const raw = await apiClient.get(`/api/v1/clusters/${clusterId}/files`, params);
  return GalleryResponseSchema.parse(raw);
}
