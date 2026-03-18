export const AlertSeverity = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
} as const;

export type AlertSeverity =
  (typeof AlertSeverity)[keyof typeof AlertSeverity];
