'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * InviteMemberDialog — formulario de convite: email + role.
 * Fonte: docs/frontend/web/04-components.md (InviteMemberDialog)
 */
export function InviteMemberDialog({
  clusterId,
  open,
  onClose,
  onInvited,
}: {
  clusterId: string;
  open: boolean;
  onClose: () => void;
  onInvited?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/clusters/${clusterId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) throw new Error('Falha ao enviar convite');
      toast.success(`Convite enviado para ${email}`);
      setEmail('');
      setRole('member');
      onInvited?.();
      onClose();
    } catch {
      toast.error('Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">Convidar membro</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="member">Member</option>
              <option value="reader">Reader</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-accent">Cancelar</button>
            <button type="submit" disabled={loading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
