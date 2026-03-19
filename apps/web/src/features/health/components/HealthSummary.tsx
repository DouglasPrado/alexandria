import { Card } from "@/components/ui";
import type { AlertDTO } from "../types/health.types";

interface HealthSummaryProps {
  alerts: AlertDTO[];
}

export function HealthSummary({ alerts }: HealthSummaryProps) {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-text">{alerts.length}</p>
        <p className="text-xs text-text-muted mt-1">Alertas Ativos</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-error">{critical}</p>
        <p className="text-xs text-text-muted mt-1">Criticos</p>
      </Card>
      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-warning">{warning}</p>
        <p className="text-xs text-text-muted mt-1">Avisos</p>
      </Card>
    </div>
  );
}
