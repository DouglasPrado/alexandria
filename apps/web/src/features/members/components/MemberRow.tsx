"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";
import type { Member } from "../types/members.types";

interface MemberRowProps {
  member: Member;
  isAdmin: boolean;
  currentMemberId?: string;
  onRemove: (memberId: string) => void;
}

function roleBadgeVariant(role: string): "success" | "info" | "default" {
  if (role === "admin") return "success";
  if (role === "membro") return "info";
  return "default";
}

function roleLabel(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "membro") return "Membro";
  if (role === "leitura") return "Leitura";
  return role;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function MemberRow({ member, isAdmin, currentMemberId, onRemove }: MemberRowProps) {
  const isSelf = member.id === currentMemberId;

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-surface-elevated/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">
            {member.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text truncate">
            {member.name}
            {isSelf && <span className="ml-1.5 text-xs text-text-muted font-normal">(você)</span>}
          </p>
          <p className="text-xs text-text-muted truncate">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="hidden sm:block text-xs text-text-muted">
          {formatDate(member.created_at)}
        </div>
        <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
        {isAdmin && !isSelf && (
          <button
            onClick={() => onRemove(member.id)}
            className="text-text-muted hover:text-error transition-colors p-1 rounded"
            title="Remover membro"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {/* Spacer to align rows where delete button is absent */}
        {(!isAdmin || isSelf) && <div className="w-6" />}
      </div>
    </div>
  );
}
