"use client";

import { joinClub } from "@/app/actions/member";
import { ActionForm, SubmitButton } from "@/components/forms";

export function JoinButton({ clubId, label = "Join Club", variant = "gold" }: { clubId: string; label?: string; variant?: "gold" | "primary" }) {
  return (
    <ActionForm action={joinClub}>
      <input type="hidden" name="clubId" value={clubId} />
      <SubmitButton variant={variant} pendingText="Joining…">{label}</SubmitButton>
    </ActionForm>
  );
}
