import { dlog } from "../config/debug";
import { VaultData, VaultHandle, VaultHandleKind } from "../types";
import { createEmptyVault } from "./vaultService";
import { VaultSaf } from "./vaultSafBridge";

const HANDLE_KEY = "kor_vault_handle";
const LOCAL_CACHE_KEY = "nexus_vault_cache";

const readLocalStorage = (key: string): string | null => {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage.getItem(key);
};

const writeLocalStorage = (key: string, value: string) => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(key, value);
};

const removeLocalStorage = (key: string) => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(key);
};

export const loadHandle = (): VaultHandle | null => {
  const raw = readLocalStorage(HANDLE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as VaultHandle;
    return parsed?.kind && parsed?.handle ? parsed : null;
  } catch (error) {
    return null;
  }
};

export const saveHandle = (handle: VaultHandle) => {
  writeLocalStorage(HANDLE_KEY, JSON.stringify(handle));
};

export const clearHandle = () => {
  removeLocalStorage(HANDLE_KEY);
};

const readLocalCache = (): VaultData | null => {
  const raw = readLocalStorage(LOCAL_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as VaultData;
  } catch (error) {
    return null;
  }
};

const writeLocalCache = (vault: VaultData) => {
  writeLocalStorage(LOCAL_CACHE_KEY, JSON.stringify(vault));
};

const readAndroidSaf = async (documentUri: string): Promise<VaultData> => {
  const content = await VaultSaf.readVaultFile(documentUri);
  return JSON.parse(content) as VaultData;
};

const writeAndroidSaf = async (documentUri: string, vault: VaultData): Promise<void> => {
  const content = JSON.stringify(vault);
  await VaultSaf.writeVaultFile(documentUri, content);
};

export const openExisting = async (): Promise<{ vault: VaultData; handle: VaultHandle }> => {
  dlog("file picker open start");
  const documentUri = await VaultSaf.pickVaultFileOpen();
  dlog("file picker open result", documentUri);
  const vault = await readAndroidSaf(documentUri);
  return { vault, handle: { kind: "androidSaf", handle: documentUri } };
};

export const createNew = async (): Promise<{ vault: VaultData; handle: VaultHandle }> => {
  dlog("file picker create start");
  const documentUri = await VaultSaf.pickVaultFileCreate();
  dlog("file picker create result", documentUri);
  const vault = createEmptyVault();
  await writeAndroidSaf(documentUri, vault);
  return { vault, handle: { kind: "androidSaf", handle: documentUri } };
};

const readLocalStorageVault = async (): Promise<VaultData> => {
  const cached = readLocalCache();
  return cached ?? createEmptyVault();
};

const writeLocalStorageVault = async (vault: VaultData): Promise<void> => {
  writeLocalCache(vault);
};

export const read = async (handle: VaultHandle): Promise<VaultData> => {
  dlog("vaultFileProvider.read", handle.kind);
  if (handle.kind === "androidSaf") {
    return readAndroidSaf(handle.handle);
  }
  return readLocalStorageVault();
};

export const write = async (handle: VaultHandle, vault: VaultData): Promise<void> => {
  dlog("vaultFileProvider.write", handle.kind);
  if (handle.kind === "androidSaf") {
    await writeAndroidSaf(handle.handle, vault);
    return;
  }
  await writeLocalStorageVault(vault);
};

export const openExistingFallback = async (): Promise<{ vault: VaultData; handle: VaultHandle }> => {
  const vault = await readLocalStorageVault();
  return { vault, handle: { kind: "localStorage", handle: LOCAL_CACHE_KEY } };
};

export const createNewFallback = async (): Promise<{ vault: VaultData; handle: VaultHandle }> => {
  const vault = createEmptyVault();
  await writeLocalStorageVault(vault);
  return { vault, handle: { kind: "localStorage", handle: LOCAL_CACHE_KEY } };
};

export const openExistingWithFallback = async (): Promise<{ vault: VaultData; handle: VaultHandle }> => {
  try {
    return await openExisting();
  } catch (error) {
    dlog("openExisting fallback", error);
    return openExistingFallback();
  }
};

export const createNewWithFallback = async (): Promise<{ vault: VaultData; handle: VaultHandle }> => {
  try {
    return await createNew();
  } catch (error) {
    dlog("createNew fallback", error);
    return createNewFallback();
  }
};

export const getLocalCache = readLocalCache;
export const setLocalCache = writeLocalCache;
