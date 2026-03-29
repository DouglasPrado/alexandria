'use client';

import { useMembers } from '../hooks/useMembers';

/**
 * MemberList — lista de membros com role badges e acoes.
 * Fonte: docs/frontend/web/04-components.md (MemberList)
 */

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  member: 'bg-info/10 text-info',
  reader: 'bg-muted text-muted-foreground',
};

export function MemberList() {
  const { data, isLoading } = useMembers();
  const members = data?.data ?? [];

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando membros...</div>;
  }

  return (
    <div className="space-y-2">
      {members.map((member: any) => (
        <div key={member.id} className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium text-foreground">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[member.role] ?? ''}`}>
            {member.role}
          </span>
        </div>
      ))}
      {members.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>
      )}
    </div>
  );
}
