"use client";

import { setGlobalRole } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";

export function RoleSelect({ userId, role, options }: { userId: string; role: string; options: { value: string; label: string }[] }) {
  return (
    <ActionForm action={setGlobalRole} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="sr-only" htmlFor={`role-${userId}`}>Platform role</label>
      <select id={`role-${userId}`} name="role" defaultValue={role} className="rounded-lg border border-brand-200 px-2 py-1.5 text-xs">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <SubmitButton variant="outline" size="sm" pendingText="…">Set</SubmitButton>
    </ActionForm>
  );
}
