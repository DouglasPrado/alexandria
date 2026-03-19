"use client";

import { Users } from "lucide-react";
import { MemberRow } from "./MemberRow";
import type { Member } from "../types/members.types";

interface MemberListProps {
  members: Member[];
  isAdmin: boolean;
  currentMemberId?: string;
  onRemove: (memberId: string) => void;
}

export function MemberList({ members, isAdmin, currentMemberId, onRemove }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-12 w-12 text-text-muted/30 mb-3" />
        <p className="text-text-muted text-sm">Nenhum membro encontrado</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          isAdmin={isAdmin}
          currentMemberId={currentMemberId}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
