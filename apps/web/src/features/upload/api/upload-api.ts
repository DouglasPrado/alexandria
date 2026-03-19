import { apiClient } from "@/services/api-client";
import { UploadResponseSchema, type UploadResponseDTO } from "../types/upload.types";

function detectMediaType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "foto";
  if (mimeType.startsWith("video/")) return "video";
  return "documento";
}

export async function uploadFile(file: File, clusterId: string): Promise<UploadResponseDTO> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("cluster_id", clusterId);
  formData.append("media_type", detectMediaType(file.type));

  const raw = await apiClient.postMultipart("/api/v1/files/upload", formData);
  return UploadResponseSchema.parse(raw);
}
