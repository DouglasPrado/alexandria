"use client";

import { useEffect, useState } from "react";
import { useCluster } from "@/hooks/useCluster";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export default function MembersPage() {
  const { cluster, loading: clusterLoading } = useCluster();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clusterLoading || !cluster) return;
    fetch(`/api/v1/clusters/${cluster.id}/members`)
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cluster, clusterLoading]);

  const roleBadge = (role: string) => {
    switch (role) {
      case "admin": return "bg-primary/10 text-primary";
      case "membro": return "bg-success/10 text-success";
      default: return "bg-border text-text-muted";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-text">Membros</h2>
        <a href="/cluster/invite" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          Convidar
        </a>
      </div>

      {(loading || clusterLoading) && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-border/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && members.length > 0 && (
        <div className="space-y-2">
          {members.map((m) => (
            <a
              key={m.id}
              href={`/cluster/members/${m.id}`}
              className="flex items-center justify-between p-4 bg-surface-elevated border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div>
                <p className="font-medium text-text">{m.name}</p>
                <p className="text-xs text-text-muted">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${roleBadge(m.role)}`}>
                  {m.role}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(m.joined_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
