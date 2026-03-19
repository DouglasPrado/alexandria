"use client";

import { useState } from "react";
import { useCluster } from "@/hooks/useCluster";
import { useAuthStore } from "@/store/auth-store";

export default function AddNodePage() {
  const { cluster } = useCluster();
  const { member } = useAuthStore();
  const [nodeType, setNodeType] = useState("local");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [endpoint, setEndpoint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cluster) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/nodes/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cluster_id: cluster.id,
          owner_id: member?.id ?? "",
          node_type: nodeType,
          name,
          total_capacity: parseInt(capacity) * 1024 * 1024 * 1024,
          endpoint: endpoint || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Erro ao registrar no");
      }
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-4xl mb-3">✅</p>
        <h2 className="text-xl font-bold text-text mb-2">No registrado!</h2>
        <a href="/nodes" className="text-primary hover:underline text-sm">Voltar para Nos</a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-text mb-6">Adicionar No</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Tipo</label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text"
          >
            <option value="local">Local (filesystem)</option>
            <option value="s3">AWS S3</option>
            <option value="r2">Cloudflare R2</option>
            <option value="vps">VPS Remota</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="ex: meu-pc, s3-backup"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Capacidade (GB)</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
            min="1"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {(nodeType === "s3" || nodeType === "r2" || nodeType === "vps") && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">Endpoint</label>
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}
        {error && <p className="text-sm text-error">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Registrar No"}
        </button>
      </form>
    </div>
  );
}
