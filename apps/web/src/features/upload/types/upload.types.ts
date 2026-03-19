import { z } from "zod";

export const UploadResponseSchema = z.object({
  file_id: z.string().uuid(),
  status: z.string(),
});
export type UploadResponseDTO = z.infer<typeof UploadResponseSchema>;

export interface UploadRequest {
  cluster_id: string;
  uploaded_by: string;
  original_name: string;
  media_type: string;
  mime_type: string;
  file_extension: string;
  original_size: number;
}
