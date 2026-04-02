/**
 * SettingsPage — perfil do membro: nome e troca de senha.
 * Fonte: docs/frontend/web/07-routes.md (/dashboard/settings)
 * Design: Alexandria Protocol — tonal layering, rounded-2xl, font-display
 *
 * Rota: /dashboard/settings
 * Auth: JWT (qualquer role)
 */
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useUpdateProfile } from '@/features/settings';
import { User, Lock, Mail, Loader2, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const member = useAuthStore((s) => s.member);
  const setMember = useAuthStore((s) => s.setMember);
  const { mutate, isPending } = useUpdateProfile();

  const [name, setName] = useState(member?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const initials = member?.name
    ? member.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const roleLabel = {
    admin: 'Administrador',
    member: 'Membro',
    reader: 'Leitor',
  }[member?.role ?? 'member'];

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      { name },
      {
        onSuccess: (data) => {
          if (member) setMember({ ...member, name: data.name });
          setProfileMsg('Nome atualizado com sucesso.');
          setTimeout(() => setProfileMsg(''), 3000);
        },
        onError: () => {
          setProfileMsg('Erro ao atualizar nome.');
          setTimeout(() => setProfileMsg(''), 3000);
        },
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
          setTimeout(() => setPasswordMsg(''), 3000);
        },
        onError: () => {
          setPasswordMsg('Senha atual incorreta.');
          setTimeout(() => setPasswordMsg(''), 3000);
        },
      },
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <span
          className="text-xs font-bold uppercase tracking-[0.2em] mb-2 block font-display"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Account Settings
        </span>
        <h1
          className="text-4xl font-extrabold font-display tracking-tight"
          style={{ color: 'var(--foreground)' }}
        >
          Minha Conta
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main content (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Profile card */}
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.04)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--surface-container-low)' }}
              >
                <User size={18} style={{ color: 'var(--primary-container)' }} />
              </div>
              <h2 className="font-display font-bold text-lg">Perfil</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <InputField
                id="settings-name"
                label="Nome"
                value={name}
                onChange={setName}
              />

              <div>
                <label
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  E-mail
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--muted-foreground)' }}
                >
                  <Mail size={14} />
                  {member?.email}
                </div>
              </div>

              {profileMsg && (
                <div
                  className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: profileMsg.includes('sucesso')
                      ? 'rgba(111, 251, 190, 0.12)' : 'rgba(186, 26, 26, 0.08)',
                    color: profileMsg.includes('sucesso') ? 'var(--success)' : 'var(--destructive)',
                  }}
                >
                  <CheckCircle size={14} />
                  {profileMsg}
                </div>
              )}

              <button
                type="submit"
                data-testid="save-profile"
                disabled={isPending}
                className="px-6 py-3 rounded-xl font-display font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: 'var(--primary-container)' }}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Salvando...
                  </span>
                ) : 'Salvar perfil'}
              </button>
            </form>
          </div>

          {/* Password card */}
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.04)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--surface-container-low)' }}
              >
                <Lock size={18} style={{ color: 'var(--primary-container)' }} />
              </div>
              <h2 className="font-display font-bold text-lg">Alterar Senha</h2>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-5">
              <InputField
                id="settings-current-pw"
                label="Senha atual"
                value={currentPassword}
                onChange={setCurrentPassword}
                type="password"
                placeholder="Digite sua senha atual"
              />
              <InputField
                id="settings-new-pw"
                label="Nova senha"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
                placeholder="Digite a nova senha"
              />

              {passwordMsg && (
                <div
                  className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: passwordMsg.includes('sucesso')
                      ? 'rgba(111, 251, 190, 0.12)' : 'rgba(186, 26, 26, 0.08)',
                    color: passwordMsg.includes('sucesso') ? 'var(--success)' : 'var(--destructive)',
                  }}
                >
                  <CheckCircle size={14} />
                  {passwordMsg}
                </div>
              )}

              <button
                type="submit"
                data-testid="save-password"
                disabled={isPending}
                className="px-6 py-3 rounded-xl font-display font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: 'var(--primary-container)' }}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Salvando...
                  </span>
                ) : 'Alterar senha'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Profile card */}
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.04)',
            }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto text-2xl font-display font-black"
              style={{
                backgroundColor: 'var(--primary-container)',
                color: 'white',
              }}
            >
              {initials}
            </div>
            <h3
              className="font-display font-bold text-lg mt-4"
              style={{ color: 'var(--foreground)' }}
            >
              {member?.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {member?.email}
            </p>
            <span
              className="inline-block mt-3 px-3 py-1 text-[10px] font-extrabold uppercase rounded-full"
              style={{
                backgroundColor: 'var(--primary-fixed)',
                color: '#001b3d',
              }}
            >
              {roleLabel}
            </span>
          </div>

          {/* Cluster info */}
          <div
            className="rounded-2xl p-6 flex items-center gap-4"
            style={{ backgroundColor: 'var(--surface-container-low)' }}
          >
            <div
              className="w-1 h-12 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--tertiary-fixed)' }}
            />
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--tertiary-fixed-dim)' }}
              >
                Cluster
              </div>
              <div className="font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                Família Prado
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Membro desde {member?.id ? 'o início' : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-none px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--surface-container-low)',
          color: 'var(--foreground)',
        }}
      />
    </div>
  );
}
