import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BootstrapView } from "./components/BootstrapView";
import { SettingsView } from "./components/SettingsView";
import { TaskRowInbox } from "./components/TaskRowInbox";
import { dlog } from "./config/debug";
import { normalizeStatus } from "./domain/status";
import { selectInboxRows } from "./selectors/inbox";
import { selectTasksForDay } from "./selectors/calendar";
import { selectNodes } from "./selectors/nodes";
import { driveIsReady } from "./services/driveSync";
import {
  getLocalCache,
  loadHandle,
  openExistingWithFallback,
  read,
  saveHandle,
} from "./services/vaultFileProvider";
import {
  applyMutation,
  createEmptyVault,
  ensureDefaultNode,
  migrateVault,
  persistVault,
  setVaultHandle,
} from "./services/vaultService";
import { initSync, requestSync, setOnline } from "./services/syncManager";
import { VaultData, VaultHandle } from "./types";

const DEFAULT_DAY = new Date().toISOString().slice(0, 10);

export const App: React.FC = () => {
  const [vault, setVault] = useState<VaultData | null>(null);
  const [handle, setHandle] = useState<VaultHandle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dbMode = handle?.kind ?? "localCache";

  const handleLoad = useCallback(async () => {
    const storedHandle = loadHandle();
    if (storedHandle) {
      const loaded = await read(storedHandle);
      const migrated = migrateVault(loaded);
      setVault(migrated);
      setHandle(storedHandle);
      setVaultHandle(storedHandle);
      dlog("vault load", { nodes: Object.keys(migrated.nodes).length, tasks: Object.keys(migrated.tasks).length });
      return;
    }

    const cached = getLocalCache();
    if (cached) {
      const migrated = migrateVault(cached);
      setVault(migrated);
      dlog("vault load", { nodes: Object.keys(migrated.nodes).length, tasks: Object.keys(migrated.tasks).length });
      return;
    }

    setVault(null);
  }, []);

  useEffect(() => {
    handleLoad();
  }, [handleLoad]);

  useEffect(() => {
    if (!vault) {
      return;
    }
    initSync(
      () => vault,
      (nextVault) => setVault(nextVault),
      () => vault.profile,
    );
    requestSync("startup");
  }, [vault]);

  useEffect(() => {
    const handler = () => setOnline(navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  const handleReady = (nextVault: VaultData, nextHandle: VaultHandle) => {
    const migrated = migrateVault(nextVault);
    setVault(migrated);
    setHandle(nextHandle);
    setVaultHandle(nextHandle);
    saveHandle(nextHandle);
  };

  const handleUpdateVault = (updater: (draft: VaultData) => VaultData) => {
    if (!vault) {
      return;
    }

    const updated = applyMutation({ ...vault }, (draft) => {
      const next = updater(draft);
      Object.values(next.tasks).forEach((task) => {
        task.status = normalizeStatus(task.status);
      });
      ensureDefaultNode(next);
      return next;
    });

    setVault(updated);
    persistVault(updated);
    if (driveIsReady(updated.profile)) {
      requestSync("auto");
    }
  };

  const inboxRows = useMemo(() => (vault ? selectInboxRows(vault) : []), [vault]);
  const todayTasks = useMemo(() => (vault ? selectTasksForDay(vault, DEFAULT_DAY) : []), [vault]);
  const nodeRows = useMemo(() => (vault ? selectNodes(vault) : []), [vault]);

  useEffect(() => {
    if (vault) {
      dlog("inbox select", { total: Object.keys(vault.tasks).length, rows: inboxRows.length });
      dlog("calendar select", { day: DEFAULT_DAY, count: todayTasks.length });
      dlog("nodes", { count: nodeRows.length });
    }
  }, [vault, inboxRows.length, todayTasks.length, nodeRows.length]);

  if (!vault) {
    return <BootstrapView onReady={handleReady} onError={(message) => setError(message)} />;
  }

  return (
    <div>
      {error ? <div style={{ color: "red" }}>{error}</div> : null}
      <h1>Kor Assistant</h1>
      <section>
        <h2>Inbox</h2>
        {inboxRows.length === 0 ? <div>0 görev</div> : null}
        {inboxRows.map((row) => (
          <TaskRowInbox key={row.id} row={row} onOpen={(id) => dlog("open task", id)} />
        ))}
      </section>
      <section>
        <h2>Takvim</h2>
        {todayTasks.length === 0 ? <div>Bu gün planlı görev yok</div> : null}
      </section>
      <section>
        <h2>Universes</h2>
        {nodeRows.map((node) => (
          <div key={node.id}>
            {node.title} ({node.taskCount})
          </div>
        ))}
      </section>
      <SettingsView
        vault={vault}
        dbMode={dbMode}
        onToggleDrive={(enabled) =>
          handleUpdateVault((draft) => ({
            ...draft,
            profile: {
              ...draft.profile,
              capabilities: {
                ...draft.profile.capabilities,
                driveEnabled: enabled,
              },
            },
          }))
        }
        onManualSync={() => requestSync("user")}
      />
      <button
        type="button"
        onClick={async () => {
          const result = await openExistingWithFallback();
          handleReady(result.vault, result.handle);
        }}
      >
        Mevcut kullanıcı aç
      </button>
    </div>
  );
};
