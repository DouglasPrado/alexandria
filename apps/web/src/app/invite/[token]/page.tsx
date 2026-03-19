"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Erro ao aceitar convite");
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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl text-center">
          <p className="text-4xl mb-3">🎉</p>
          <h2 className="text-xl font-bold text-text mb-2">Bem-vindo!</h2>
          <p className="text-sm text-text-muted mb-4">Convite aceito com sucesso.</p>
          <a href="/gallery" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
            Ir para Galeria
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl">
        <h1 className="text-xl font-bold text-text text-center mb-1">Convite Alexandria</h1>
        <p className="text-sm text-text-muted text-center mb-6">
          Voce foi convidado para um cluster familiar.
        </p>

        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Crie uma senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Aceitando..." : "Aceitar Convite"}
          </button>
        </form>
      </div>
    </div>
  );
}
