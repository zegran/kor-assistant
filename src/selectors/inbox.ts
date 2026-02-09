import { Task, VaultData } from "../types";

export type InboxRow = {
  id: string;
  nodeTitle: string;
  reminder: string;
  statusLabel: string;
  due: string;
  updatedAt: number;
  task: Task;
};

const statusLabels: Record<string, string> = {
  todo: "Todo",
  inbox: "Inbox",
  in_progress: "In Progress",
  done: "Done",
  canceled: "Canceled",
  blocked: "Blocked",
  scheduled: "Scheduled",
  postponed: "Postponed",
};

const formatDue = (dueAt: number | null): string => {
  if (!dueAt) {
    return "";
  }
  return new Date(dueAt).toLocaleDateString();
};

export const selectInboxRows = (vault: VaultData): InboxRow[] => {
  const nodes = vault.nodes;
  return Object.values(vault.tasks)
    .map((task) => ({
      id: task.id,
      nodeTitle: nodes[task.nodeId]?.title ?? "",
      reminder: task.reminderNote ?? "",
      statusLabel: statusLabels[task.status] ?? "Todo",
      due: formatDue(task.dueAt),
      updatedAt: task.updatedAt,
      task,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
};
