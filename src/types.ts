export type TaskStatus =
  | "todo"
  | "inbox"
  | "in_progress"
  | "done"
  | "canceled"
  | "blocked"
  | "scheduled"
  | "postponed";

export type TaskLog = {
  id: string;
  createdAt: number;
  note: string;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  nodeId: string;
  updatedAt: number;
  dueAt: number | null;
  reminderNote: string;
  logs: TaskLog[];
};

export type Node = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type VaultMeta = {
  schemaVersion: number;
  appVersion: string;
  deviceId: string;
  createdAt: number;
  updatedAt: number;
  lastLocalWriteAt: number | null;
  lastDriveSyncAt: number | null;
  lastDriveSyncStatus: "idle" | "ok" | "error" | "syncing";
  lastDriveSyncError: string | null;
};

export type ProfileCapabilities = {
  driveEnabled: boolean;
};

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  capabilities: ProfileCapabilities;
};

export type VaultData = {
  meta: VaultMeta;
  profile: Profile;
  nodes: Record<string, Node>;
  tasks: Record<string, Task>;
  settings: Record<string, unknown>;
};

export type VaultHandleKind = "localStorage" | "androidSaf";

export type VaultHandle = {
  kind: VaultHandleKind;
  handle: string;
};
