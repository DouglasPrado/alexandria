import type { File } from "../entities/file";
import type { MediaType } from "../enums/media-type";

export interface ListFilesParams {
  clusterId: string;
  cursor?: string;
  limit?: number;
  mediaType?: MediaType;
}

export interface ListFilesResponse {
  files: File[];
  nextCursor: string | null;
}

export interface GetFileResponse {
  file: File;
}
