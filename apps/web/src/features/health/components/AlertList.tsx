import { Badge } from "@/components/ui";
import { timeAgo } from "@/utils/format";
import type { AlertDTO } from "../types/health.types";

const severityVariant = {
  critical: "error",
  warning: "warning",
  info: "info",
} as const;

const severityBorder = {
  critical: "border-l-error bg-error/5",
  warning: "border-l-warning bg-warning/5",
  info: "border-l-info bg-info/5",
} as const;

interface AlertListProps {
  alerts: AlertDTO[];
}

export function AlertList({ alerts }: AlertListProps) {
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 border-l-4 rounded-lg ${
            severityBorder[alert.severity as keyof typeof severityBorder] ?? "border-l-info bg-info/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant={severityVariant[alert.severity as keyof typeof severityVariant] ?? "info"}
              >
                {alert.severity}
              </Badge>
              <span className="text-xs text-text-muted font-mono">{alert.alert_type}</span>
            </div>
            <span className="text-xs text-text-muted">{timeAgo(alert.created_at)}</span>
          </div>
          <p className="text-sm text-text mt-2">{alert.message}</p>
        </div>
      ))}
    </div>
  );
}
