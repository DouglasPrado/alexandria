export const AlertType = {
  NODE_OFFLINE: "node_offline",
  LOW_REPLICATION: "low_replication",
  INTEGRITY_ERROR: "integrity_error",
  TOKEN_EXPIRED: "token_expired",
  SPACE_LOW: "space_low",
} as const;

export type AlertType = (typeof AlertType)[keyof typeof AlertType];
