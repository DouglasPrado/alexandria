export const FileStatus = {
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "error",
} as const;

export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];
