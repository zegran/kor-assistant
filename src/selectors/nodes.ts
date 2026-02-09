import { VaultData } from "../types";

export type NodeSummary = {
  id: string;
  title: string;
  taskCount: number;
};

export const selectNodes = (vault: VaultData): NodeSummary[] => {
  const counts: Record<string, number> = {};
  Object.values(vault.tasks).forEach((task) => {
    counts[task.nodeId] = (counts[task.nodeId] ?? 0) + 1;
  });

  return Object.values(vault.nodes).map((node) => ({
    id: node.id,
    title: node.title,
    taskCount: counts[node.id] ?? 0,
  }));
};
