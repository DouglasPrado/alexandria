'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api-client';

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<{ cluster: { id: string; name: string }; seedPhrase: string }>('/clusters', {
        name,
        admin: { name: adminName, email: adminEmail, password: adminPassword },
      });
      sessionStorage.setItem('seedPhrase', res.seedPhrase);
      sessionStorage.setItem('clusterName', res.cluster.name);
      router.push('/setup/seed');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar cluster');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Criar seu cluster familiar</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Seu espaco privado para guardar memorias da familia</p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Nome do cluster</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="Ex: Familia Prado" />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Este sera o nome visivel para todos os membros</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Seu nome</label>
              <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} required className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email</label>
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Sua senha de acesso</label>
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="Minimo 8 caracteres" />
            </div>
            {error && <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-[var(--radius)] p-3 text-sm text-[var(--destructive)]">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Criando cluster...' : 'Criar cluster'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
