'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * SetupClusterForm — formulario de criacao de cluster.
 * Fonte: docs/frontend/web/04-components.md (SetupClusterForm)
 */
export function SetupClusterForm({
  onSuccess,
}: {
  onSuccess: (data: { seedPhrase: string; clusterId: string }) => void;
}) {
  const [name, setName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, admin: { name: adminName, email, password } }),
      });
      if (!res.ok) throw new Error('Falha ao criar cluster');
      const data = await res.json();
      toast.success('Cluster criado com sucesso');
      onSuccess({ seedPhrase: data.seedPhrase, clusterId: data.cluster.id });
    } catch {
      toast.error('Erro ao criar cluster');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground">Nome do cluster</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Familia Prado" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground">Seu nome</label>
        <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} required minLength={2} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground">Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Min 8 chars, 1 maiuscula, 1 numero" />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {loading ? 'Criando...' : 'Criar cluster'}
      </button>
    </form>
  );
}
