export type VaultSafPlugin = {
  pickVaultFileOpen: () => Promise<string>;
  pickVaultFileCreate: () => Promise<string>;
  readVaultFile: (documentUri: string) => Promise<string>;
  writeVaultFile: (documentUri: string, content: string) => Promise<void>;
};

const missingPlugin = async (): Promise<never> => {
  throw new Error("VaultSaf plugin not available");
};

export const VaultSaf: VaultSafPlugin = {
  pickVaultFileOpen: missingPlugin,
  pickVaultFileCreate: missingPlugin,
  readVaultFile: missingPlugin,
  writeVaultFile: missingPlugin,
};
