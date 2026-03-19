import { Badge, Card } from "@/components/ui";
import { CapacityBar } from "./CapacityBar";
import type { NodeDTO } from "../types/nodes.types";

const statusVariant = {
  online: "success",
  suspect: "warning",
  lost: "error",
  draining: "info",
} as const;

interface NodeCardProps {
  node: NodeDTO;
}

export function NodeCard({ node }: NodeCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-text">{node.name}</h3>
          <Badge variant={statusVariant[node.status as keyof typeof statusVariant] ?? "default"}>
            {node.status}
          </Badge>
        </div>
        <span className="text-xs text-text-muted font-mono">{node.node_type}</span>
      </div>
      <CapacityBar used={node.used_capacity} total={node.total_capacity} />
    </Card>
  );
}
