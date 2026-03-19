"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useValidateInvite } from "../hooks/useValidateInvite";
import { acceptInvite } from "../api/auth-api";
import { useAuthStore } from "@/store/auth-store";
import { PasswordInput } from "./PasswordInput";

interface InviteAcceptFormProps {
  token: string;
}

export function InviteAcceptForm({ token }: InviteAcceptFormProps) {
  const router = useRouter();
  const authLogin = useAuthStore((s) => s.login);

  const { data: invite, isLoading, isError } = useValidateInvite(token);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptInvite(token, {
        name,
        email: email || invite?.email || "",
        password,
      }),
    onSuccess: (data) => {
      authLogin({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        member: data.member,
      });
      router.push("/gallery");
    },
    onError: () => {
      setFormError("Erro ao aceitar convite. Verifique os dados e tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }
    if (password.length < 8) {
      setFormError("Senha deve ter ao menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("As senhas não coincidem");
      return;
    }

    acceptMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl text-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-muted">Verificando convite...</p>
      </div>
    );
  }

  if (isError || !invite?.valid) {
    return (
      <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl text-center">
        <p className="text-red-500 text-lg font-semibold mb-2">Convite inválido</p>
        <p className="text-sm text-text-muted mb-4">
          {invite?.error ?? "Este convite expirou ou é inválido."}
        </p>
        <a href="/login" className="text-primary text-sm hover:underline">
          Ir para login
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl">
      <h1 className="text-xl font-bold text-text text-center mb-1">Aceitar Convite</h1>
      {invite.cluster_name && (
        <p className="text-sm text-text-muted text-center mb-6">
          Você foi convidado para o cluster <strong>{invite.cluster_name}</strong>
          {invite.role && ` como ${invite.role}`}.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Seu Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Nome completo"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Email</label>
          <input
            type="email"
            value={email || invite.email || ""}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={!!invite.email}
            className={`w-full px-3 py-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 ${invite.email ? "bg-surface-elevated opacity-70 cursor-not-allowed" : "bg-surface-elevated"}`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Criar Senha</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Confirmar Senha</label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={
              confirmPassword && password !== confirmPassword
                ? "As senhas não coincidem"
                : undefined
            }
          />
        </div>

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={acceptMutation.isPending}
          className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {acceptMutation.isPending ? "Aceitando..." : "Aceitar Convite"}
        </button>
      </form>

      <p className="text-xs text-text-muted text-center mt-4">
        Já tem conta?{" "}
        <a href="/login" className="text-primary hover:underline">
          Fazer login
        </a>
      </p>
    </div>
  );
}
