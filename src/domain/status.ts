import { TaskStatus } from "../types";

const allowedStatuses: TaskStatus[] = [
  "todo",
  "inbox",
  "in_progress",
  "done",
  "canceled",
  "blocked",
  "scheduled",
  "postponed",
];

export const normalizeStatus = (status: string | null | undefined): TaskStatus => {
  if (!status) {
    return "todo";
  }

  const normalized = status.trim().toLowerCase() as TaskStatus;
  return allowedStatuses.includes(normalized) ? normalized : "todo";
};
