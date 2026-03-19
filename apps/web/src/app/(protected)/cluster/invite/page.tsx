"use client";

import { useState } from "react";
import { useCluster } from "@/hooks/useCluster";

export default function InviteCreatePage() {
  const { cluster } = useCluster();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("membro");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ token: string; expires_at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cluster) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/clusters/${cluster.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Erro ao criar convite");
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-text mb-6">Convidar Membro</h2>

      {result ? (
        <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
          <p className="text-success font-medium mb-2">Convite criado!</p>
          <p className="text-sm text-text mb-1">Envie este link ao convidado:</p>
          <code className="block p-2 bg-surface text-xs font-mono text-text rounded break-all">
            {typeof window !== "undefined" ? window.location.origin : ""}/invite/{result.token}
          </code>
          <p className="text-xs text-text-muted mt-2">Expira em: {result.expires_at}</p>
        </div>
      ) : (
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Email do convidado</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Papel</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text"
            >
              <option value="membro">Membro</option>
              <option value="leitura">Somente Leitura</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Convite"}
          </button>
        </form>
      )}
    </div>
  );
}
