"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Modal, Button, Input } from "@/components/ui";
import { useInviteMember } from "../hooks/useInviteMember";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  clusterId: string;
}

export function InviteModal({ open, onClose, clusterId }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("membro");
  const [copied, setCopied] = useState(false);

  const invite = useInviteMember(clusterId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    invite.mutate({ email, role });
  };

  const handleCopy = async () => {
    if (!invite.data?.invite_token) return;
    await navigator.clipboard.writeText(invite.data.invite_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail("");
    setRole("membro");
    setCopied(false);
    invite.reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Convidar Membro">
      {invite.isSuccess && invite.data ? (
        <div className="space-y-4">
          <p className="text-sm text-text">
            Convite gerado com sucesso! Compartilhe o link abaixo com o novo membro.
          </p>
          <div className="flex items-center gap-2 bg-surface rounded-lg border border-border p-3">
            <p className="text-xs text-text-muted font-mono break-all flex-1 select-all">
              {invite.data.invite_token}
            </p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 text-text-muted hover:text-text transition-colors"
              title="Copiar token"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button variant="ghost" className="w-full" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Função</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="membro">Membro</option>
              <option value="leitura">Somente leitura</option>
            </select>
          </div>

          {invite.isError && (
            <p className="text-sm text-error">
              {(invite.error as Error)?.message ?? "Erro ao gerar convite"}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? "Gerando..." : "Gerar Convite"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
