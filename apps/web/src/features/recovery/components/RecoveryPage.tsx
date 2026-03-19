"use client";

import { useState } from "react";
import { Button, Alert } from "@/components/ui";
import { Header } from "@/components/layouts/Header";
import { useRecovery } from "../hooks/useRecovery";
import { SeedPhraseInput } from "./SeedPhraseInput";
import { RecoveryReport } from "./RecoveryReport";

export function RecoveryPage() {
  const [seedPhrase, setSeedPhrase] = useState("");
  const recovery = useRecovery();

  const handleSubmit = () => {
    if (!seedPhrase.trim()) return;
    recovery.mutate(seedPhrase.trim());
  };

  return (
    <div className="max-w-lg mx-auto">
      <Header
        title="Recovery via Seed Phrase"
        description="Insira a seed phrase de 12 palavras para reconstruir o sistema."
      />

      <SeedPhraseInput
        value={seedPhrase}
        onChange={setSeedPhrase}
        disabled={recovery.isPending}
      />

      <div className="mt-4">
        <Button
          onClick={handleSubmit}
          loading={recovery.isPending}
          disabled={!seedPhrase.trim()}
        >
          Iniciar Recovery
        </Button>
      </div>

      {recovery.error && (
        <Alert variant="error" className="mt-4">
          {recovery.error.message}
        </Alert>
      )}

      {recovery.data && <RecoveryReport report={recovery.data} />}
    </div>
  );
}
