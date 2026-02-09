import React, { useState } from "react";
import { createNew, createNewFallback, openExisting, openExistingFallback } from "../services/vaultFileProvider";
import { VaultData, VaultHandle } from "../types";

type BootstrapViewProps = {
  onReady: (vault: VaultData, handle: VaultHandle) => void;
  onError: (message: string) => void;
};

export const BootstrapView: React.FC<BootstrapViewProps> = ({ onReady, onError }) => {
  const [mode, setMode] = useState<"localStorage" | "androidSaf" | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const handleCreate = async () => {
    if (!mode) {
      return;
    }
    try {
      const result = mode === "androidSaf" ? await createNew() : await createNewFallback();
      result.vault.profile = {
        ...result.vault.profile,
        firstName,
        lastName,
        email,
      };
      onReady(result.vault, result.handle);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Create failed");
    }
  };

  const handleOpen = async () => {
    if (!mode) {
      return;
    }
    try {
      const result = mode === "androidSaf" ? await openExisting() : await openExistingFallback();
      onReady(result.vault, result.handle);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Open failed");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Başlangıç</h2>
      <div>
        <label>
          <input
            type="radio"
            name="mode"
            value="localStorage"
            checked={mode === "localStorage"}
            onChange={() => setMode("localStorage")}
          />
          Cihazda yerel (web)
        </label>
        <label style={{ marginLeft: 12 }}>
          <input
            type="radio"
            name="mode"
            value="androidSaf"
            checked={mode === "androidSaf"}
            onChange={() => setMode("androidSaf")}
          />
          Android SAF
        </label>
      </div>

      <h3>Yeni kullanıcı</h3>
      <input placeholder="İsim" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
      <input placeholder="Soyisim" value={lastName} onChange={(event) => setLastName(event.target.value)} />
      <input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <button type="button" onClick={handleCreate} disabled={!mode}>
        Yeni DB oluştur
      </button>

      <h3>Mevcut kullanıcı</h3>
      <button type="button" onClick={handleOpen} disabled={!mode}>
        Var olan DB aç
      </button>
    </div>
  );
};
