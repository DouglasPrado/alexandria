import { Badge, Card } from "@/components/ui";
import type { QueueItem } from "../hooks/useUploadQueue";

const statusConfig = {
  pending: { label: "Pendente", variant: "default" as const },
  uploading: { label: "Enviando...", variant: "info" as const },
  done: { label: "Concluido", variant: "success" as const },
  error: { label: "Erro", variant: "error" as const },
};

interface UploadQueueProps {
  items: QueueItem[];
}

export function UploadQueue({ items }: UploadQueueProps) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const config = statusConfig[item.status];
        return (
          <Card key={i} className="flex items-center justify-between p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text truncate">{item.file.name}</p>
              <p className="text-xs text-text-muted">
                {(item.file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <Badge variant={config.variant}>
              {item.status === "error" ? item.error ?? config.label : config.label}
            </Badge>
          </Card>
        );
      })}
    </div>
  );
}
