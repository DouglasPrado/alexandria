"use client";

import { useState } from "react";
import { api, type RecoveryReport } from "@/lib/api";

export default function RecoveryPage() {
  const [seedPhrase, setSeedPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RecoveryReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecovery = async () => {
    if (!seedPhrase.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await api.startRecovery(seedPhrase.trim());
      setReport(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-text mb-2">Recovery via Seed Phrase</h2>
      <p className="text-text-muted text-sm mb-6">
        Insira a seed phrase de 12 palavras para reconstruir o sistema.
      </p>

      {/* Seed input */}
      <textarea
        value={seedPhrase}
        onChange={(e) => setSeedPhrase(e.target.value)}
        placeholder="palavra1 palavra2 palavra3 ... palavra12"
        rows={3}
        className="w-full p-3 border border-border rounded-lg font-mono text-sm bg-surface-elevated text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleRecovery}
          disabled={loading || !seedPhrase.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processando..." : "Iniciar Recovery"}
        </button>
        <span className="text-xs text-text-muted">
          {seedPhrase.trim().split(/\s+/).filter(Boolean).length}/12 palavras
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-error/10 text-error rounded-lg text-sm">{error}</div>
      )}

      {/* Report */}
      {report && (
        <div className="mt-6 p-4 bg-surface-elevated border border-border rounded-lg">
          <h3 className="font-medium text-text mb-3">Resultado do Recovery</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Seed valida</span>
              <span className={report.seed_valid ? "text-success" : "text-error"}>
                {report.seed_valid ? "Sim" : "Nao"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Master key derivada</span>
              <span className={report.master_key_derived ? "text-success" : "text-error"}>
                {report.master_key_derived ? "Sim" : "Nao"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Vaults recuperados</span>
              <span className="text-text font-mono">{report.vaults_recovered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Manifests encontrados</span>
              <span className="text-text font-mono">{report.manifests_found}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Arquivos recuperados</span>
              <span className="text-text font-mono">{report.files_recovered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Status</span>
              <span
                className={`font-medium ${
                  report.status === "Complete" ? "text-success" :
                  report.status === "Partial" ? "text-warning" :
                  "text-error"
                }`}
              >
                {report.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
