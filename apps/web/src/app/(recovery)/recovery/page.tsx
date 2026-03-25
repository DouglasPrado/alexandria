'use client';

import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { ShieldCheck, Server, HardDrive } from 'lucide-react';

interface RecoveryResult {
  status: string;
  recoveredVaults: number;
  nodesReconnected: number;
  nodesOffline: number;
  integrityCheck: {
    totalChunks: number;
    healthyChunks: number;
    pendingHealing: number;
  };
}

export default function RecoveryPage() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<RecoveryResult>('/clusters/recovery', { seedPhrase });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro na recuperacao');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Recuperar o sistema</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Insira as 12 palavras da seed phrase para reconstruir o banco de dados e reconectar os nos.
          </p>
        </div>

        {!result ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Seed phrase</label>
                <textarea
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] font-mono text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  placeholder="Digite ou cole cada palavra"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">12 palavras separadas por espaco</p>
              </div>
              {error && <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-[var(--radius)] p-3 text-sm text-[var(--destructive)]">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? 'Validando seed phrase...' : 'Iniciar recovery'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[var(--success)]/10 border border-[var(--success)] rounded-[var(--radius)] p-4 flex items-center gap-3">
              <ShieldCheck size={24} className="text-[var(--success)]" />
              <div>
                <p className="font-semibold text-[var(--foreground)]">Sistema recuperado</p>
                <p className="text-sm text-[var(--muted-foreground)]">O banco de dados foi reconstruido com sucesso.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm mb-1">
                  <ShieldCheck size={14} />
                  Vaults recuperados
                </div>
                <div className="text-2xl font-bold text-[var(--foreground)]">{result.recoveredVaults}</div>
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm mb-1">
                  <Server size={14} />
                  Nos reconectados
                </div>
                <div className="text-2xl font-bold text-[var(--foreground)]">{result.nodesReconnected}</div>
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm mb-1">
                  <HardDrive size={14} />
                  Chunks verificados
                </div>
                <div className="text-2xl font-bold text-[var(--foreground)]">{result.integrityCheck.totalChunks}</div>
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm mb-1">
                  Pendente
                </div>
                <div className="text-2xl font-bold text-[var(--foreground)]">{result.integrityCheck.pendingHealing}</div>
                <p className="text-xs text-[var(--muted-foreground)]">chunks aguardando re-replicacao</p>
              </div>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] text-center">
              Atualize o DNS do seu dominio para apontar para o novo servidor.
            </p>

            <a href="/login" className="block w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 transition-opacity text-center text-sm">
              Ir para o dashboard
            </a>
          </div>
        )}

        {!result && (
          <a href="/login" className="block text-center text-sm text-[var(--muted-foreground)] hover:underline">
            Voltar para login
          </a>
        )}
      </div>
    </main>
  );
}
