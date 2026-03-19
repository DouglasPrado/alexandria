"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createCluster } from "../api/auth-api";
import { useAuthStore } from "@/store/auth-store";
import { SeedPhraseDisplay } from "./SeedPhraseDisplay";
import { PasswordInput } from "./PasswordInput";

type Step = "welcome" | "create" | "seed";

interface PendingAuth {
  access_token: string;
  refresh_token: string;
  member: { id: string; name: string; email: string; role: string; cluster_id: string };
}

interface CreateForm {
  clusterName: string;
  adminName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SetupWizard() {
  const router = useRouter();
  const authLogin = useAuthStore((s) => s.login);

  const [step, setStep] = useState<Step>("welcome");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const pendingAuthRef = useRef<PendingAuth | null>(null);

  const [form, setForm] = useState<CreateForm>({
    clusterName: "",
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCluster({
        name: form.clusterName,
        admin_name: form.adminName,
        admin_email: form.email,
        admin_password: form.password,
      }),
    onSuccess: (data) => {
      // IMPORTANT: Show seed phrase BEFORE logging in.
      // authLogin sets isAuthenticated=true which could trigger redirects.
      // Store tokens temporarily, login only after user confirms seed phrase.
      pendingAuthRef.current = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        member: {
          id: "",
          name: form.adminName,
          email: form.email,
          role: "admin",
          cluster_id: data.cluster_id,
        },
      };
      setSeedPhrase(data.seed_phrase);
      setStep("seed");
    },
    onError: () => {
      setFormError("Erro ao criar cluster. Tente novamente.");
    },
  });

  const handleFieldChange = (field: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateForm = (): string | null => {
    if (!form.clusterName.trim()) return "Nome do cluster é obrigatório";
    if (!form.adminName.trim()) return "Seu nome é obrigatório";
    if (!form.email.trim() || !form.email.includes("@")) return "Email inválido";
    if (form.password.length < 8) return "Senha deve ter ao menos 8 caracteres";
    if (form.password !== form.confirmPassword) return "As senhas não coincidem";
    return null;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    createMutation.mutate();
  };

  const handleSeedConfirm = () => {
    // Now that user confirmed seed phrase, complete the login
    if (pendingAuthRef.current) {
      authLogin(pendingAuthRef.current);
      pendingAuthRef.current = null;
    }
    router.push("/gallery");
  };

  if (step === "welcome") {
    return (
      <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl">
        <h1 className="text-2xl font-bold text-text text-center mb-1">Alexandria</h1>
        <p className="text-sm text-text-muted text-center mb-8">Armazenamento Familiar Distribuído</p>

        <div className="space-y-3">
          <button
            onClick={() => setStep("create")}
            className="w-full py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Criar Cluster
          </button>
          <a
            href="/invite"
            className="block w-full py-3 border border-border text-text rounded-lg text-sm font-medium text-center hover:bg-surface-elevated"
          >
            Tenho um convite
          </a>
          <a
            href="/login"
            className="block w-full py-2 text-text-muted text-sm text-center hover:text-text"
          >
            Já tenho conta
          </a>
        </div>
      </div>
    );
  }

  if (step === "seed") {
    return (
      <div className="w-full max-w-md p-6 bg-white border border-border rounded-xl">
        <h1 className="text-xl font-bold text-text text-center mb-6">Cluster Criado!</h1>
        <SeedPhraseDisplay seedPhrase={seedPhrase} onConfirm={handleSeedConfirm} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm p-6 bg-white border border-border rounded-xl">
      <button
        onClick={() => setStep("welcome")}
        className="text-text-muted text-sm hover:text-text mb-4 inline-flex items-center gap-1"
      >
        ← Voltar
      </button>

      <h1 className="text-xl font-bold text-text mb-1">Criar Cluster</h1>
      <p className="text-sm text-text-muted mb-6">Configure seu armazenamento familiar</p>

      <form onSubmit={handleCreateSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Nome do Cluster</label>
          <input
            type="text"
            value={form.clusterName}
            onChange={handleFieldChange("clusterName")}
            placeholder="Ex: Família Prado"
            required
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Seu Nome</label>
          <input
            type="text"
            value={form.adminName}
            onChange={handleFieldChange("adminName")}
            placeholder="Nome completo"
            required
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={handleFieldChange("email")}
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Senha</label>
          <PasswordInput
            value={form.password}
            onChange={handleFieldChange("password")}
            required
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Confirmar Senha</label>
          <PasswordInput
            value={form.confirmPassword}
            onChange={handleFieldChange("confirmPassword")}
            required
            autoComplete="new-password"
            error={
              form.confirmPassword && form.password !== form.confirmPassword
                ? "As senhas não coincidem"
                : undefined
            }
          />
        </div>

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {createMutation.isPending ? "Criando..." : "Criar Cluster"}
        </button>
      </form>
    </div>
  );
}
