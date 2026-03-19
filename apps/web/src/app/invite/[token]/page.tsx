import { InviteAcceptForm } from "@/features/auth/components/InviteAcceptForm";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <InviteAcceptForm token={token} />
    </div>
  );
}
