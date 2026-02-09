import { dlog } from "../config/debug";
import { normalizeStatus } from "../domain/status";
import { Task, TaskLog, VaultData, VaultHandle } from "../types";
import { setLocalCache, write } from "./vaultFileProvider";
import { vaultWriteQueue } from "./vaultWriteQueue";

const DEFAULT_NODE_ID = "default";
const SCHEMA_VERSION = 1;

let activeHandle: VaultHandle | null = null;

export const setVaultHandle = (handle: VaultHandle | null) => {
  activeHandle = handle;
};

export const createEmptyVault = (): VaultData => {
  const now = Date.now();
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      appVersion: "0.0.0",
      deviceId: "",
      createdAt: now,
      updatedAt: now,
      lastLocalWriteAt: null,
      lastDriveSyncAt: null,
      lastDriveSyncStatus: "idle",
      lastDriveSyncError: null,
    },
    profile: {
      firstName: "",
      lastName: "",
      email: "",
      capabilities: {
        driveEnabled: false,
      },
    },
    nodes: {
      [DEFAULT_NODE_ID]: {
        id: DEFAULT_NODE_ID,
        title: "Inbox",
        createdAt: now,
        updatedAt: now,
      },
    },
    tasks: {},
    settings: {},
  };
};

export const ensureDefaultNode = (vault: VaultData): VaultData => {
  if (!vault.nodes[DEFAULT_NODE_ID]) {
    const now = Date.now();
    vault.nodes[DEFAULT_NODE_ID] = {
      id: DEFAULT_NODE_ID,
      title: "Inbox",
      createdAt: now,
      updatedAt: now,
    };
  }
  return vault;
};

const migrateNotesToLogs = (task: Task & { notes?: string }) => {
  if (task.logs && task.logs.length > 0) {
    return task;
  }
  if (!task.notes) {
    return task;
  }

  const log: TaskLog = {
    id: `log_${task.id}`,
    createdAt: task.updatedAt,
    note: task.notes,
  };

  return {
    ...task,
    logs: [log],
  };
};

export const migrateVault = (vault: VaultData): VaultData => {
  const next = { ...vault };
  next.meta = { ...vault.meta };
  next.nodes = { ...vault.nodes };
  next.tasks = { ...vault.tasks };

  next.meta.schemaVersion = SCHEMA_VERSION;

  Object.values(next.tasks).forEach((task) => {
    const migrated = migrateNotesToLogs(task as Task & { notes?: string });
    migrated.status = normalizeStatus(migrated.status);
    if (!migrated.nodeId) {
      migrated.nodeId = DEFAULT_NODE_ID;
    }
    next.tasks[migrated.id] = migrated;
  });

  ensureDefaultNode(next);
  return next;
};

export const touchMeta = (vault: VaultData): VaultData => {
  const now = Date.now();
  vault.meta.updatedAt = now;
  return vault;
};

export const applyMutation = (vault: VaultData, updater: (next: VaultData) => VaultData) => {
  const next = updater(vault);
  ensureDefaultNode(next);
  touchMeta(next);
  return next;
};

export const persistVault = async (vault: VaultData): Promise<void> => {
  await vaultWriteQueue.enqueue(async () => {
    const now = Date.now();
    vault.meta.lastLocalWriteAt = now;
    setLocalCache(vault);
    if (activeHandle) {
      await write(activeHandle, vault);
    }
    dlog("persistVault", {
      mode: activeHandle?.kind ?? "localCache",
      lastLocalWriteAt: vault.meta.lastLocalWriteAt,
      bytes: JSON.stringify(vault).length,
    });
  });
};
