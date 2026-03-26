'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAcceptInvite } from '@/features/members';
import { useAuthStore } from '@/store/auth-store';
import { Shield, UserPlus } from 'lucide-react';

/**
 * Accept Invite page — formulario publico para aceitar convite.
 * Fonte: docs/frontend/web/08-flows.md (Accept Invite)
 * Fonte: docs/backend/05-api-contracts.md (POST /api/invites/:token/accept)
 *
 * Rota: /invites/[token]/accept
 * Publica — nao requer autenticacao.
 */
export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const acceptInvite = useAcceptInvite();
  const setMember = useAuthStore((s) => s.setMember);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Senhas nao conferem');
      return;
    }

    if (password.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      const result = await acceptInvite.mutateAsync({
        token: params.token,
        name: name.trim(),
        password,
      });

      // Save auth state and redirect to dashboard
      setMember(result.member);
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.body?.message || err?.message || 'Erro ao aceitar convite';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary)]/10 mb-4">
            <Shield size={32} className="text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Alexandria</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Voce foi convidado para um cluster familiar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={18} className="text-[var(--primary)]" />
            <h2 className="text-lg font-medium text-[var(--foreground)]">Aceitar Convite</h2>
          </div>

          {error && (
            <div className="p-3 text-sm rounded-md bg-red-500/10 text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-[var(--muted-foreground)]">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              required
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--muted-foreground)]">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              required
              minLength={8}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--muted-foreground)]">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <button
            type="submit"
            disabled={acceptInvite.isPending || !name.trim() || !password}
            className="w-full py-2.5 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {acceptInvite.isPending ? 'Entrando...' : 'Aceitar e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
