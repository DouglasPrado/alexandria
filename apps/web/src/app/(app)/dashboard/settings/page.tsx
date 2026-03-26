/**
 * SettingsPage — perfil do membro: nome e troca de senha.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/settings)
 * Fonte: docs/backend/05-api-contracts.md (PATCH /api/members/me)
 *
 * Rota: /dashboard/settings
 * Auth: JWT (qualquer role)
 */
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useUpdateProfile } from '@/features/settings';

export default function SettingsPage() {
  const member = useAuthStore((s) => s.member);
  const setMember = useAuthStore((s) => s.setMember);
  const { mutate, isPending } = useUpdateProfile();

  const [name, setName] = useState(member?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      { name },
      {
        onSuccess: (data) => {
          if (member) setMember({ ...member, name: data.name });
          setProfileMsg('Nome atualizado com sucesso.');
        },
        onError: () => setProfileMsg('Erro ao atualizar nome.'),
      },
    );
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setPasswordMsg('Senha alterada com sucesso.');
        },
        onError: () => setPasswordMsg('Senha atual incorreta.'),
      },
    );
  }

  return (
    <div className="p-6 max-w-xl space-y-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Configurações</h1>

      {isPending && (
        <div data-testid="settings-saving" className="text-sm text-[var(--muted-foreground)]">
          Salvando...
        </div>
      )}

      {/* Perfil */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Perfil</h2>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1" htmlFor="settings-name">
              Nome
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">E-mail</label>
            <p className="text-sm text-[var(--muted-foreground)]">{member?.email}</p>
          </div>
          {profileMsg && <p className="text-xs text-[var(--muted-foreground)]">{profileMsg}</p>}
          <button
            type="submit"
            data-testid="save-profile"
            disabled={isPending}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Salvar perfil
          </button>
        </form>
      </section>

      {/* Senha */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Alterar senha</h2>
        <form onSubmit={handleSavePassword} className="space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nova senha"
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--input)] rounded-[var(--radius)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          {passwordMsg && <p className="text-xs text-[var(--muted-foreground)]">{passwordMsg}</p>}
          <button
            type="submit"
            data-testid="save-password"
            disabled={isPending}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Alterar senha
          </button>
        </form>
      </section>
    </div>
  );
}
