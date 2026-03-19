import { z } from "zod";

export const FileSchema = z.object({
  id: z.string().uuid(),
  cluster_id: z.string().uuid(),
  original_name: z.string(),
  media_type: z.string(),
  mime_type: z.string(),
  file_extension: z.string(),
  original_size: z.number(),
  optimized_size: z.number(),
  status: z.string(),
  created_at: z.string(),
});
export type FileDTO = z.infer<typeof FileSchema>;

export const GalleryResponseSchema = z.object({
  files: z.array(FileSchema),
  next_cursor: z.string().nullable(),
});
export type GalleryResponse = z.infer<typeof GalleryResponseSchema>;
