import { Card } from "@/components/ui";
import type { RecoveryReportDTO } from "../types/recovery.types";

interface RecoveryReportProps {
  report: RecoveryReportDTO;
}

function StatusColor({ status }: { status: string }) {
  const color =
    status === "Complete" ? "text-success" :
    status === "Partial" ? "text-warning" :
    "text-error";
  return <span className={`font-medium ${color}`}>{status}</span>;
}

function BoolValue({ value }: { value: boolean }) {
  return (
    <span className={value ? "text-success" : "text-error"}>
      {value ? "Sim" : "Nao"}
    </span>
  );
}

export function RecoveryReport({ report }: RecoveryReportProps) {
  return (
    <Card className="mt-6">
      <Card.Header>
        <h3 className="font-medium text-text">Resultado do Recovery</h3>
      </Card.Header>
      <Card.Body>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Seed valida</span>
            <BoolValue value={report.seed_valid} />
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Master key derivada</span>
            <BoolValue value={report.master_key_derived} />
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Vaults recuperados</span>
            <span className="text-text font-mono">{report.vaults_recovered}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Manifests encontrados</span>
            <span className="text-text font-mono">{report.manifests_found}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Arquivos recuperados</span>
            <span className="text-text font-mono">{report.files_recovered}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Status</span>
            <StatusColor status={report.status} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
