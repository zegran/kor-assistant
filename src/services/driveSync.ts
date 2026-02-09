import { Profile, VaultData } from "../types";

export const driveIsReady = (profile: Profile): boolean => {
  return profile.capabilities.driveEnabled;
};

export const drivePull = async (): Promise<{ vault: VaultData; remoteUpdatedAt: number } | null> => {
  return null;
};

export const drivePush = async (_vault: VaultData): Promise<void> => {
  return;
};
