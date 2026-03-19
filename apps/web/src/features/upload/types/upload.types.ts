import { z } from "zod";

export const UploadResponseSchema = z.object({
  file_id: z.string().uuid(),
  status: z.string(),
});
export type UploadResponseDTO = z.infer<typeof UploadResponseSchema>;
