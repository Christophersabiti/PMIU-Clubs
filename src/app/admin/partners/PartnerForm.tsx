import type { Partner } from "@prisma/client";
import { savePartner } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input, Select, Textarea, inputCls } from "@/components/ui";
import { toLocalInput } from "@/lib/utils";

export function PartnerForm({ partner }: { partner?: Partner }) {
  return (
    <ActionForm action={savePartner} className="space-y-6">
      {partner && <input type="hidden" name="id" value={partner.id} />}
      <Card className="grid gap-4 sm:grid-cols-2">
        <Input label="Partner name" name="name" defaultValue={partner?.name} required />
        <Select label="Status" name="status" defaultValue={partner?.status ?? "ACTIVE"} options={[{ value: "ACTIVE", label: "Active" }, { value: "PROSPECT", label: "Prospect / to be confirmed" }, { value: "INACTIVE", label: "Inactive (hidden)" }]} />
        <div className="sm:col-span-2"><Textarea label="Description" name="description" defaultValue={partner?.description ?? ""} rows={3} /></div>
        <Textarea label="Expertise" name="expertise" defaultValue={partner?.expertise ?? ""} rows={4} hint="One per line" />
        <div className="space-y-4">
          <Field label="Logo" name="logoFile"><input id="logoFile" name="logoFile" type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} /></Field>
          <Input label="Website" name="website" type="url" defaultValue={partner?.website ?? ""} />
          <Input label="Active since" name="activeSince" type="date" defaultValue={partner?.activeSince ? toLocalInput(partner.activeSince).slice(0, 10) : ""} />
        </div>
        <Input label="Contact name" name="contactName" defaultValue={partner?.contactName ?? ""} />
        <Input label="Contact email" name="contactEmail" type="email" defaultValue={partner?.contactEmail ?? ""} hint="Shown publicly as a Contact button" />
        <Input label="Contact phone" name="contactPhone" defaultValue={partner?.contactPhone ?? ""} hint="Internal only" />
      </Card>
      <SubmitButton>{partner ? "Save partner" : "Create partner"}</SubmitButton>
    </ActionForm>
  );
}
