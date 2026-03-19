import { apiClient } from "@/services/api-client";
import { UploadResponseSchema, type UploadResponseDTO, type UploadRequest } from "../types/upload.types";

export async function uploadFile(data: UploadRequest): Promise<UploadResponseDTO> {
  const raw = await apiClient.post("/api/v1/files/upload", data);
  return UploadResponseSchema.parse(raw);
}
