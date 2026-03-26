'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useMembers, useInvite, useRemoveMember } from '@/features/members';
import { Users, UserPlus, Trash2, Copy, Check, Crown, Eye } from 'lucide-react';

/**
 * Members page — lista membros do cluster + dialog para criar convite.
 * Fonte: docs/frontend/web/08-flows.md (Invite Member)
 * Admin-only: sidebar filtra por role.
 */

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  member: 'Membro',
  reader: 'Leitor',
};

const roleIcons: Record<string, typeof Crown> = {
  admin: Crown,
  member: Users,
  reader: Eye,
};

export default function MembersPage() {
  const member = useAuthStore((s) => s.member);
  const clusterId = member?.clusterId;
  const { data: members, isLoading } = useMembers(clusterId);
  const invite = useInvite(clusterId);
  const removeMember = useRemoveMember(clusterId);

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    const result = await invite.mutateAsync({ email: email.trim(), role });
    const fullUrl = `${window.location.origin}${result.inviteUrl}`;
    setInviteUrl(fullUrl);
    setEmail('');
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Remover ${memberName} do cluster?`)) return;
    await removeMember.mutateAsync(memberId);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-[var(--foreground)]" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Membros</h1>
          {members && (
            <span className="text-sm text-[var(--muted-foreground)]">({members.length}/10)</span>
          )}
        </div>

        <button
          onClick={() => { setShowInvite(true); setInviteUrl(null); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          <UserPlus size={16} />
          Convidar
        </button>
      </div>

      {/* Invite Dialog */}
      {showInvite && (
        <div className="mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <h2 className="text-sm font-medium text-[var(--foreground)] mb-3">Novo Convite</h2>

          {!inviteUrl ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--muted-foreground)]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@email.com"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted-foreground)]">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                >
                  <option value="member">Membro</option>
                  <option value="reader">Leitor</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleInvite}
                  disabled={invite.isPending || !email.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                >
                  {invite.isPending ? 'Criando...' : 'Criar Convite'}
                </button>
                <button
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 text-sm rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-emerald-600">Convite criado! Copie o link e envie ao convidado:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <button
                onClick={() => { setShowInvite(false); setInviteUrl(null); }}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members List */}
      {isLoading && (
        <div className="text-center py-12 text-[var(--muted-foreground)]">Carregando membros...</div>
      )}

      {members && (
        <div className="space-y-2">
          {members.map((m) => {
            const RoleIcon = roleIcons[m.role] || Users;
            const isCurrentUser = m.id === member?.id;

            return (
              <div
                key={m.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center text-sm font-medium text-[var(--foreground)]">
                  {m.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)] truncate">{m.name}</span>
                    {isCurrentUser && (
                      <span className="text-xs text-[var(--muted-foreground)]">(voce)</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">{m.email}</p>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
                  <RoleIcon size={12} />
                  {roleLabels[m.role] || m.role}
                </div>

                {!isCurrentUser && member?.role === 'admin' && (
                  <button
                    onClick={() => handleRemove(m.id, m.name)}
                    disabled={removeMember.isPending}
                    className="p-2 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors disabled:opacity-50"
                    title="Remover membro"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
