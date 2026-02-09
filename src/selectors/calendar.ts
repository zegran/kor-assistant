import { VaultData } from "../types";

const formatDayKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const selectTasksForDay = (vault: VaultData, dayKey: string) => {
  return Object.values(vault.tasks).filter((task) => {
    if (!task.dueAt) {
      return false;
    }
    return formatDayKey(task.dueAt) === dayKey;
  });
};
