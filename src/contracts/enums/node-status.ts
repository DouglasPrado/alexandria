export const NodeStatus = {
  ONLINE: "online",
  SUSPECT: "suspect",
  LOST: "lost",
  DRAINING: "draining",
} as const;

export type NodeStatus = (typeof NodeStatus)[keyof typeof NodeStatus];
