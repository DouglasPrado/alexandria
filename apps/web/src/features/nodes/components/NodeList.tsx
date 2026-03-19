import type { NodeDTO } from "../types/nodes.types";
import { NodeCard } from "./NodeCard";

interface NodeListProps {
  nodes: NodeDTO[];
}

export function NodeList({ nodes }: NodeListProps) {
  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <NodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}
