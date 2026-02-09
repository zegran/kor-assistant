import { dlog, derr } from "../config/debug";
import { driveIsReady, drivePull, drivePush } from "./driveSync";
import { VaultData } from "../types";

let vaultRefGetter: (() => VaultData | null) | null = null;
let vaultSetter: ((vault: VaultData) => void) | null = null;
let profileGetter: (() => VaultData["profile"] | null) | null = null;

let inFlight = false;
let pending = false;
let online = true;
let debounceTimer: number | null = null;

export const initSync = (
  vaultGetter: () => VaultData | null,
  setter: (vault: VaultData) => void,
  profileGetterFn: () => VaultData["profile"] | null,
) => {
  vaultRefGetter = vaultGetter;
  vaultSetter = setter;
  profileGetter = profileGetterFn;
};

export const setOnline = (isOnline: boolean) => {
  online = isOnline;
};

const updateMeta = (vault: VaultData, updates: Partial<VaultData["meta"]>) => {
  vault.meta = { ...vault.meta, ...updates };
  return vault;
};

const performSync = async (reason: "startup" | "user" | "auto") => {
  if (inFlight) {
    pending = true;
    return;
  }

  const profile = profileGetter?.();
  if (!profile || !driveIsReady(profile)) {
    return;
  }

  if (!online) {
    return;
  }

  const currentVault = vaultRefGetter?.();
  if (!currentVault || !vaultSetter) {
    return;
  }

  inFlight = true;
  pending = false;
  const now = Date.now();
  vaultSetter(updateMeta({ ...currentVault }, { lastDriveSyncStatus: "syncing", lastDriveSyncError: null }));

  try {
    dlog("sync pull start", reason);
    const pullResult = await drivePull();
    let mergedVault = currentVault;

    if (pullResult?.vault) {
      const remote = pullResult.vault;
      if (pullResult.remoteUpdatedAt > currentVault.meta.updatedAt) {
        mergedVault = remote;
        dlog("sync pull ok", pullResult.remoteUpdatedAt);
      }
    }

    if (mergedVault.meta.updatedAt >= currentVault.meta.updatedAt) {
      await drivePush(mergedVault);
      dlog("sync push ok");
    }

    mergedVault = updateMeta({ ...mergedVault }, {
      lastDriveSyncAt: now,
      lastDriveSyncStatus: "ok",
      lastDriveSyncError: null,
    });

    vaultSetter(mergedVault);
  } catch (error) {
    const vault = vaultRefGetter?.();
    if (vault && vaultSetter) {
      vaultSetter(
        updateMeta({ ...vault }, {
          lastDriveSyncAt: now,
          lastDriveSyncStatus: "error",
          lastDriveSyncError: error instanceof Error ? error.message : "sync error",
        }),
      );
    }
    derr("sync error", error);
  } finally {
    inFlight = false;
    if (pending) {
      pending = false;
      performSync("auto");
    }
  }
};

export const requestSync = (reason: "startup" | "user" | "auto") => {
  if (reason === "auto") {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => {
      performSync("auto");
    }, 1000);
    return;
  }

  performSync(reason);
};
