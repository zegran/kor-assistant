import React from "react";
import { VaultData } from "../types";

type SettingsViewProps = {
  vault: VaultData;
  dbMode: string;
  onToggleDrive: (enabled: boolean) => void;
  onManualSync: () => void;
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  vault,
  dbMode,
  onToggleDrive,
  onManualSync,
}) => {
  const meta = vault.meta;

  return (
    <div style={{ padding: 16 }}>
      <h2>Ayarlar</h2>
      <div>DB mode: {dbMode}</div>
      <div>Last local write: {meta.lastLocalWriteAt ? new Date(meta.lastLocalWriteAt).toLocaleString() : "-"}</div>
      <div>
        Last drive sync: {meta.lastDriveSyncAt ? new Date(meta.lastDriveSyncAt).toLocaleString() : "-"}
      </div>
      <div>Drive status: {meta.lastDriveSyncStatus}</div>
      <div>Drive error: {meta.lastDriveSyncError ?? "-"}</div>
      <label>
        <input
          type="checkbox"
          checked={vault.profile.capabilities.driveEnabled}
          onChange={(event) => onToggleDrive(event.target.checked)}
        />
        Drive enabled
      </label>
      <button type="button" onClick={onManualSync}>
        Şimdi Senkronize Et
      </button>
    </div>
  );
};
