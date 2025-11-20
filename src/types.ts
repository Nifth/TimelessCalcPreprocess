export interface NodeMod {
  type: string;
  stats: string[];
}

export interface JewelEffect {
  seed: number;
  modifiedNodes: Record<number, NodeMod>; // node.graph_id → mod
}