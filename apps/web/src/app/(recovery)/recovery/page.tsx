'use client';

import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { ShieldCheck, Server, HardDrive, AlertTriangle } from 'lucide-react';

interface RecoveryResult {
  status: string;
  coldRecovery: boolean;
  clusterId: string;
  recoveredVaults: number;
  nodesReconnected: number;
  nodesOffline: number;
  discoveredManifests: number;
  discoveredChunks: number;
  integrityCheck: {
    totalChunks: number;
    healthyChunks: number;
    pendingHealing: number;
  };
  nextSteps: string[];
}

export default function RecoveryPage() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);

  // Cold recovery fields (shown when DB is empty)
  const [needsColdRecovery, setNeedsColdRecovery] = useState(false);
  const [clusterName, setClusterName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  async function handleSeedSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<RecoveryResult>('/clusters/recovery', { seedPhrase });
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.message.includes('cold recovery')) {
        setNeedsColdRecovery(true);
        setError('');
      } else {
        setError(err instanceof ApiError ? err.message : 'Erro na recuperacao');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleColdRecoverySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<RecoveryResult>('/clusters/recovery', {
        seedPhrase,
        clusterName,
        adminName,
        adminEmail,
        adminPassword,
      });
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
            {needsColdRecovery
              ? 'Banco de dados vazio detectado. Informe os dados do admin para recriar o cluster.'
              : 'Insira as 12 palavras da seed phrase para reconstruir o banco de dados e reconectar os nos.'}
          </p>
        </div>

        {!result && !needsColdRecovery && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-sm">
            <form onSubmit={handleSeedSubmit} className="space-y-4">
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
        )}

        {!result && needsColdRecovery && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-amber-500">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">Cold Recovery — banco vazio</span>
            </div>

            <div className="mb-4 p-3 bg-[var(--background)] rounded-[var(--radius)] border border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Seed phrase validada</p>
              <p className="text-sm font-mono text-[var(--foreground)] truncate">{seedPhrase.split(' ').slice(0, 3).join(' ')} ...</p>
            </div>

            <form onSubmit={handleColdRecoverySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Nome do cluster</label>
                <input
                  type="text"
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  required
                  placeholder="Ex: Familia Prado"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Seu nome</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Ex: Douglas"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Nova senha</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimo 8 caracteres"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              {error && <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-[var(--radius)] p-3 text-sm text-[var(--destructive)]">{error}</div>}

              <button type="submit" disabled={loading} className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? 'Recriando cluster...' : 'Recriar cluster e recuperar'}
              </button>

              <button type="button" onClick={() => { setNeedsColdRecovery(false); setError(''); }} className="w-full py-2 text-sm text-[var(--muted-foreground)] hover:underline">
                Voltar
              </button>
            </form>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[var(--radius)] p-4 flex items-center gap-3">
              <ShieldCheck size={24} className="text-emerald-500" />
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  {result.coldRecovery ? 'Cluster recriado' : 'Sistema recuperado'}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {result.coldRecovery
                    ? 'O cluster foi recriado. Reconecte seus providers cloud para recuperar os dados.'
                    : 'O banco de dados foi reconstruido com sucesso.'}
                </p>
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
                  Chunks encontrados
                </div>
                <div className="text-2xl font-bold text-[var(--foreground)]">{result.discoveredChunks}</div>
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm mb-1">
                  Manifests
                </div>
                <div className="text-2xl font-bold text-[var(--foreground)]">{result.discoveredManifests}</div>
              </div>
            </div>

            {result.nextSteps.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius)] p-4">
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">Proximos passos:</p>
                <ol className="text-sm text-[var(--muted-foreground)] space-y-1 list-decimal list-inside">
                  {result.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <a href="/login" className="block w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 transition-opacity text-center text-sm">
              Ir para o login
            </a>
          </div>
        )}

        {!result && !needsColdRecovery && (
          <a href="/login" className="block text-center text-sm text-[var(--muted-foreground)] hover:underline">
            Voltar para login
          </a>
        )}
      </div>
    </main>
  );
}
