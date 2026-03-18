export const NodeType = {
  LOCAL: "local",
  S3: "s3",
  R2: "r2",
  VPS: "vps",
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];
