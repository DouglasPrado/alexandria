/**
 * Members page — lista membros do cluster + convite.
 * Fonte: docs/frontend/web/08-flows.md (Invite Member)
 * Design: Stitch — Gerenciamento de Membros (Asymmetric grid 8+4, table-like list)
 * Admin-only: sidebar filtra por role.
 */
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useClusterStats } from '@/features/cluster';
import { useMembers, useInvite, useRemoveMember } from '@/features/members';
import {
  UserPlus,
  Download,
  Edit,
  MoreVertical,
  Copy,
  Check,
  X,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { formatBytes } from '@/lib/format';

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  admin: { bg: 'var(--primary-fixed)', label: 'Admin', color: '#001b3d' },
  member: { bg: 'var(--secondary-container)', label: 'Membro', color: 'var(--secondary)' },
  reader: { bg: 'var(--surface-container-high)', label: 'Leitor', color: 'var(--muted-foreground)' },
};

export default function MembersPage() {
  const currentMember = useAuthStore((s) => s.member);
  const clusterId = currentMember?.clusterId;
  const { data: members, isLoading } = useMembers(clusterId);
  const { data: stats } = useClusterStats();
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
    setInviteUrl(`${window.location.origin}${result.inviteUrl}`);
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

  const memberCount = members?.length ?? 0;
  const maxMembers = 10;
  const slotsLeft = maxMembers - memberCount;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded"
              style={{ backgroundColor: 'var(--tertiary-fixed)', color: '#002113' }}
            >
              Management
            </span>
          </div>
          <h1 className="text-4xl font-extrabold font-display tracking-tighter flex items-center gap-4">
            Membros{' '}
            <span className="text-2xl font-normal opacity-50" style={{ color: 'var(--muted-foreground)' }}>
              ({memberCount}/{maxMembers})
            </span>
          </h1>
        </div>
        <div className="flex gap-4">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors"
            style={{
              backgroundColor: 'var(--surface-container-highest)',
              color: 'var(--muted-foreground)',
            }}
          >
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={() => { setShowInvite(true); setInviteUrl(null); }}
            className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--primary-container)',
              boxShadow: '0 10px 25px rgba(0, 27, 61, 0.1)',
            }}
          >
            <UserPlus size={18} />
            Convidar
          </button>
        </div>
      </div>

      {/* Bento Layout: Members (8 cols) + Stats (4 cols) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Members List */}
        <div className="col-span-12 lg:col-span-8">
          <div
            className="rounded-xl p-1 overflow-hidden"
            style={{ backgroundColor: 'var(--surface-container-low)' }}
          >
            <div className="space-y-1">
              {/* Table header */}
              <div
                className="grid grid-cols-12 px-6 py-4 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}
              >
                <div className="col-span-5">Identidade</div>
                <div className="col-span-3">Uso de Dados</div>
                <div className="col-span-2 text-center">Permissão</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="px-6 py-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                  Carregando membros...
                </div>
              )}

              {/* Member rows */}
              {members?.map((m) => {
                const isCurrentUser = m.id === currentMember?.id;
                const roleStyle = ROLE_STYLES[m.role] ?? ROLE_STYLES.reader;
                const usedBytes = m.usedStorageBytes ?? 0;
                const quotaLabel = m.storageQuotaBytes != null
                  ? formatBytes(m.storageQuotaBytes)
                  : 'Ilimitado';
                const usagePct = m.storageQuotaBytes
                  ? Math.round((usedBytes / m.storageQuotaBytes) * 100)
                  : 0;

                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-12 items-center px-6 py-5 rounded-lg group transition-all"
                    style={{ backgroundColor: 'var(--surface-container-lowest)' }}
                  >
                    {/* Identity */}
                    <div className="col-span-5 flex items-center gap-4">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold grayscale-[0.5] group-hover:grayscale-0 transition-all"
                          style={{
                            backgroundColor: 'var(--surface-container-high)',
                            color: 'var(--primary-container)',
                          }}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        {isCurrentUser && (
                          <div
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: 'var(--tertiary-fixed)' }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>
                          {m.name}{isCurrentUser ? ' (você)' : ''}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {m.email}
                        </div>
                      </div>
                    </div>

                    {/* Data usage */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                          {formatBytes(usedBytes)}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          de {quotaLabel}
                        </span>
                      </div>
                      <div
                        className="h-1 w-32 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--surface-container-highest)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(usagePct, 1)}%`,
                            backgroundColor: 'var(--tertiary-fixed)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Role badge */}
                    <div className="col-span-2 flex justify-center">
                      <span
                        className="px-3 py-1 text-[10px] font-extrabold uppercase rounded-full"
                        style={{ backgroundColor: roleStyle!.bg, color: roleStyle!.color }}
                      >
                        {roleStyle!.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end gap-2">
                      <button
                        className="p-2 rounded transition-colors"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        <Edit size={16} />
                      </button>
                      {!isCurrentUser && currentMember?.role === 'admin' && (
                        <button
                          onClick={() => handleRemove(m.id, m.name)}
                          disabled={removeMember.isPending}
                          className="p-2 rounded transition-colors disabled:opacity-50"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty slots placeholder */}
              {!isLoading && slotsLeft > 0 && (
                <div
                  className="px-6 py-12 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center"
                  style={{ borderColor: 'rgba(198, 198, 205, 0.3)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--surface-container-high)' }}
                  >
                    <UserPlus size={20} style={{ color: 'var(--outline-variant)' }} />
                  </div>
                  <h3 className="font-bold font-display" style={{ color: 'var(--foreground)' }}>
                    Slots disponíveis
                  </h3>
                  <p className="text-xs max-w-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Você ainda possui {slotsLeft} convites disponíveis para o seu cluster atual.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Column — Stats sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Quota Overview (Glassmorphism) */}
          <QuotaCard stats={stats} />

          {/* Cluster Health mini card */}
          <div
            className="rounded-xl p-6 flex items-center gap-5"
            style={{ backgroundColor: 'var(--surface-container-lowest)' }}
          >
            <div
              className="w-1 h-12 rounded-full"
              style={{ backgroundColor: 'var(--tertiary-fixed)' }}
            />
            <div className="flex-1">
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--tertiary-fixed-dim)' }}
              >
                Status do Cluster
              </div>
              <div className="font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                Membros Sincronizados
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Todos os {memberCount} membros estão ativos
              </div>
            </div>
            <ShieldCheck size={28} style={{ color: 'var(--tertiary-fixed)' }} />
          </div>

          {/* Activity Log */}
          <div className="p-2">
            <h4
              className="text-[10px] font-bold uppercase tracking-widest mb-4 px-4"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Atividade Recente
            </h4>
            <div className="space-y-1">
              <ActivityItem
                dot="var(--primary-fixed)"
                text={<><span className="font-bold">{currentMember?.name ?? 'Admin'}</span> criou o cluster Alexandria.</>}
                time="Há 2 dias"
              />
              <ActivityItem
                dot="var(--outline-variant)"
                text={<><span className="font-bold">Sistema</span> atualizou as permissões de Admin.</>}
                time="Há 1 dia"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          email={email}
          setEmail={setEmail}
          role={role}
          setRole={setRole}
          inviteUrl={inviteUrl}
          copied={copied}
          isPending={invite.isPending}
          onInvite={handleInvite}
          onCopy={handleCopy}
          onClose={() => { setShowInvite(false); setInviteUrl(null); }}
        />
      )}
    </div>
  );
}

function QuotaCard({ stats }: { stats: { totalStorage: number; usedStorage: number } | undefined }) {
  const totalCapacity = stats?.totalStorage ?? 0;
  const usedCapacity = stats?.usedStorage ?? 0;
  const freeCapacity = totalCapacity - usedCapacity;
  const pct = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

  return (
    <div
      className="relative overflow-hidden rounded-xl p-8 shadow-2xl"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 25px 50px rgba(0, 27, 61, 0.05)',
      }}
    >
      <div
        className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(0, 27, 61, 0.05)' }}
      />
      <h3 className="font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
        Cota da Organização
      </h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Capacidade Total
            </span>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              {formatBytes(totalCapacity)}
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--surface-container-high)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: 'var(--primary-container)' }}
            />
          </div>
        </div>
        <div
          className="grid grid-cols-2 gap-4 pt-4"
          style={{ borderTop: '1px solid rgba(198, 198, 205, 0.1)' }}
        >
          <div>
            <div
              className="text-[10px] uppercase font-bold"
              style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}
            >
              Utilizado
            </div>
            <div className="font-display font-bold" style={{ color: 'var(--foreground)' }}>
              {formatBytes(usedCapacity)}
            </div>
          </div>
          <div>
            <div
              className="text-[10px] uppercase font-bold"
              style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}
            >
              Disponível
            </div>
            <div className="font-display font-bold" style={{ color: 'var(--foreground)' }}>
              {formatBytes(freeCapacity)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ dot, text, time }: { dot: string; text: React.ReactNode; time: string }) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-lg transition-colors cursor-pointer"
      style={{ color: 'var(--foreground)' }}
    >
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: dot }} />
      <div>
        <p className="text-sm">{text}</p>
        <p className="text-[10px] mt-1" style={{ color: 'var(--muted-foreground)' }}>{time}</p>
      </div>
    </div>
  );
}

function InviteModal({
  email, setEmail, role, setRole, inviteUrl, copied, isPending,
  onInvite, onCopy, onClose,
}: {
  email: string; setEmail: (v: string) => void;
  role: string; setRole: (v: string) => void;
  inviteUrl: string | null; copied: boolean; isPending: boolean;
  onInvite: () => void; onCopy: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(19, 27, 46, 0.4)' }}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-container-lowest)',
          boxShadow: '0px 24px 48px rgba(19, 27, 46, 0.12)',
        }}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold font-display tracking-tight" style={{ color: 'var(--foreground)' }}>
              {inviteUrl ? 'Convite Criado' : 'Novo Convite'}
            </h2>
            {!inviteUrl && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Envie um convite para um novo membro
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ color: 'var(--muted-foreground)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6">
          {!inviteUrl ? (
            <div className="space-y-4">
              <div>
                <label
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@email.com"
                  className="w-full rounded-xl border-none px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Permissão
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'member', label: 'Membro', desc: 'Upload e visualização' },
                    { value: 'reader', label: 'Leitor', desc: 'Apenas visualização' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        backgroundColor: role === opt.value ? 'var(--primary-container)' : 'var(--surface-container-low)',
                        color: role === opt.value ? 'white' : 'var(--foreground)',
                      }}
                    >
                      <span className="font-display font-bold text-sm block">{opt.label}</span>
                      <span className="text-xs opacity-70 block mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl font-display font-bold text-sm transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--foreground)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={onInvite}
                  disabled={isPending || !email.trim()}
                  className="flex-1 py-3.5 rounded-xl font-display font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary-container)' }}
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Criando...
                    </span>
                  ) : 'Criar Convite'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'rgba(111, 251, 190, 0.15)' }}
              >
                <Check size={28} style={{ color: 'var(--success)' }} />
              </div>
              <p className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
                Copie o link e envie ao convidado:
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-4 py-3 text-sm rounded-xl font-mono border-none"
                  style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--foreground)' }}
                />
                <button
                  onClick={onCopy}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--foreground)' }}
                >
                  {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl font-display font-bold text-sm text-white transition-all active:scale-95"
                style={{ backgroundColor: 'var(--primary-container)' }}
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
