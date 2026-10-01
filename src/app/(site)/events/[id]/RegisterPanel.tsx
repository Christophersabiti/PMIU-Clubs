"use client";

import { cancelRegistration, registerForEvent } from "@/app/actions/member";
import { ActionForm, SubmitButton } from "@/components/forms";

export function RegisterButton({ eventId, label }: { eventId: string; label: string }) {
  return (
    <ActionForm action={registerForEvent}>
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton variant="gold" className="w-full" pendingText="Registering…">{label}</SubmitButton>
    </ActionForm>
  );
}

export function CancelButton({ eventId }: { eventId: string }) {
  return (
    <ActionForm action={cancelRegistration} confirm="Cancel your registration for this event?">
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton variant="ghost" size="sm" className="w-full" pendingText="Cancelling…">Cancel registration</SubmitButton>
    </ActionForm>
  );
}
