"use client";

import { useState } from "react";
import { UserPlus, ShieldOff } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui";
import { Header } from "@/components/layouts/Header";
import { Skeleton } from "@/components/ui";
import { useMembers } from "../hooks/useMembers";
import { removeMember } from "../api/members-api";
import { MemberList } from "./MemberList";
import { InviteModal } from "./InviteModal";

export function MembersPage() {
  const { member } = useAuthStore();
  const [inviteOpen, setInviteOpen] = useState(false);

  const clusterId = member?.cluster_id ?? "";
  const isAdmin = member?.role === "admin";

  const { data: members, isLoading, isError } = useMembers(clusterId);

  const handleRemove = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro?")) return;
    try {
      await removeMember(clusterId, memberId);
    } catch (e) {
      alert((e as Error).message ?? "Erro ao remover membro");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <ShieldOff className="h-12 w-12 text-text-muted/30" />
        <p className="text-text font-medium">Acesso restrito</p>
        <p className="text-sm text-text-muted">
          Apenas administradores podem gerenciar membros do cluster.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Header title="Membros" description="Gerencie os membros do seu cluster familiar">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Convidar
        </Button>
      </Header>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        {isLoading && (
          <div className="divide-y divide-border">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="px-4 py-8 text-center text-sm text-error">
            Erro ao carregar membros. Tente novamente.
          </div>
        )}

        {!isLoading && !isError && (
          <MemberList
            members={members ?? []}
            isAdmin={isAdmin}
            currentMemberId={member?.id}
            onRemove={handleRemove}
          />
        )}
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        clusterId={clusterId}
      />
    </div>
  );
}
