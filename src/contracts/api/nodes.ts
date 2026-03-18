import type { Node } from "../entities/node";
import type { NodeType } from "../enums/node-type";

export interface RegisterNodeRequest {
  name: string;
  type: NodeType;
  totalCapacity: number;
  endpoint?: string;
}

export interface RegisterNodeResponse {
  node: Node;
}

export interface ListNodesResponse {
  nodes: Node[];
}
