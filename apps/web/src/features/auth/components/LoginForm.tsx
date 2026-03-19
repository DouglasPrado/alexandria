"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "../hooks/useLogin";
import { PasswordInput } from "./PasswordInput";
import { unlockMasterKey } from "../api/auth-api";

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (data.master_key_status === "locked") {
            setShowUnlock(true);
          } else {
            router.push("/gallery");
          }
        },
        onError: () => setError("Email ou senha inválidos"),
      },
    );
  };

  const handleUnlock = async () => {
    try {
      await unlockMasterKey(seedPhrase);
      router.push("/gallery");
    } catch {
      setError("Seed phrase inválida");
    }
  };

  if (showUnlock) {
    return (
      <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl">
        <h1 className="text-xl font-bold text-text text-center mb-1">Desbloquear Vault</h1>
        <p className="text-sm text-text-muted text-center mb-6">
          Digite sua seed phrase de 12 palavras para desbloquear o sistema.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Seed Phrase</label>
            <textarea
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
              placeholder="palavra1 palavra2 palavra3 ..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={handleUnlock}
            disabled={!seedPhrase.trim()}
            className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Desbloquear
          </button>
          <button
            type="button"
            onClick={() => {
              setShowUnlock(false);
              setError(null);
              setSeedPhrase("");
            }}
            className="w-full py-2 text-text-muted text-sm hover:text-text"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl">
      <h1 className="text-2xl font-bold text-text text-center mb-1">Alexandria</h1>
      <p className="text-sm text-text-muted text-center mb-6">Armazenamento Familiar</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Senha</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loginMutation.isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-xs text-text-muted text-center mt-4">
        Sem conta?{" "}
        <a href="/setup" className="text-primary hover:underline">
          Criar cluster
        </a>
      </p>
      <p className="text-xs text-text-muted text-center mt-2">
        Recebeu um convite?{" "}
        <a href="/invite" className="text-primary hover:underline">
          Aceitar convite
        </a>
      </p>
    </div>
  );
}
