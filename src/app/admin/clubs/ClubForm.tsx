import type { Club } from "@prisma/client";
import { saveClub } from "@/app/actions/admin";
import { CLUB_ICON_OPTIONS } from "@/components/ClubIcon";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Checkbox, Field, Input, Select, Textarea, inputCls } from "@/components/ui";
import { toLocalInput } from "@/lib/utils";

export function ClubForm({ club, canToggleActive }: { club?: Club; canToggleActive?: boolean }) {
  return (
    <ActionForm action={saveClub} className="space-y-6">
      {club && <input type="hidden" name="id" value={club.id} />}
      <Card className="grid gap-4 sm:grid-cols-2">
        <Input label="Club name" name="name" defaultValue={club?.name} required placeholder="PMI Uganda Agile Community Club" />
        <Input label="Short name" name="shortName" defaultValue={club?.shortName} required placeholder="Agile" />
        {!club && <Input label="URL slug" name="slug" placeholder="agile" hint="Optional — generated from the short name" />}
        <Input label="Tagline" name="tagline" defaultValue={club?.tagline ?? ""} placeholder="Learn. Mentor. Grow." />
        <Input label="Focus" name="focus" defaultValue={club?.focus ?? ""} placeholder="Communication • Leadership" />
        <div className="sm:col-span-2"><Input label="Card summary" name="summary" defaultValue={club?.summary ?? ""} maxLength={200} /></div>
        <div className="sm:col-span-2"><Textarea label="About the club" name="description" defaultValue={club?.description ?? ""} rows={3} /></div>
        <div className="sm:col-span-2"><Textarea label="Vision — why the club exists" name="vision" defaultValue={club?.vision ?? ""} rows={2} /></div>
        <Textarea label="What you'll gain" name="gains" defaultValue={club?.gains ?? ""} rows={5} hint="One item per line" />
        <Textarea label="What the club will do" name="programme" defaultValue={club?.programme ?? ""} rows={5} hint="One item per line" />
      </Card>
      <Card className="grid gap-4 sm:grid-cols-3">
        <Field label="Accent colour" name="accent"><input id="accent" name="accent" type="color" defaultValue={club?.accent ?? "#7c3aed"} className="h-11 w-full rounded-xl border border-brand-200" /></Field>
        <Select label="Icon" name="icon" defaultValue={club?.icon ?? "users"} options={CLUB_ICON_OPTIONS.map((i) => ({ value: i, label: i }))} />
        <Input label="Sort order" name="sortOrder" type="number" defaultValue={club?.sortOrder ?? 0} />
        <Field label="Cover image" name="coverFile" hint="JPG/PNG/WebP, max 4 MB">
          <input id="coverFile" name="coverFile" type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} />
        </Field>
        <Input label="…or cover image URL" name="coverImage" defaultValue={club?.coverImage ?? ""} />
        <Input label="WhatsApp community link" name="whatsappUrl" type="url" defaultValue={club?.whatsappUrl ?? ""} placeholder="https://chat.whatsapp.com/…" />
        <div className="sm:col-span-3"><Checkbox name="requiresApproval" label="Join requests need Club Captain approval" defaultChecked={club?.requiresApproval ?? true} /></div>
        {club && canToggleActive && <div className="sm:col-span-3"><Checkbox name="active" label="Club is active and visible" defaultChecked={club.active} /></div>}
      </Card>
      <Card className="grid gap-4 sm:grid-cols-3">
        <p className="font-display text-lg font-semibold sm:col-span-3">Participation target</p>
        <Input label="Target (display)" name="targetValue" defaultValue={club?.targetValue ?? ""} placeholder="25+" />
        <div className="sm:col-span-2"><Input label="Target description" name="targetLabel" defaultValue={club?.targetLabel ?? ""} placeholder="members engaged in public-speaking activities" /></div>
        <Input label="Numeric goal" name="targetNumber" type="number" defaultValue={club?.targetNumber ?? ""} />
        <Select label="Measured by" name="targetMetric" defaultValue={club?.targetMetric ?? ""} placeholder="—" options={[
          { value: "MEMBERS", label: "Members engaged (check-ins)" },
          { value: "ACTIVITIES", label: "Activities delivered" },
          { value: "SESSIONS", label: "Sessions delivered" },
          { value: "COACHES", label: "Coaches trained (impact metric)" },
          { value: "PROJECTS", label: "Community projects (impact metric)" },
        ]} />
        <Input label="Deadline" name="targetDeadline" type="date" defaultValue={club?.targetDeadline ? toLocalInput(club.targetDeadline).slice(0, 10) : ""} />
      </Card>
      <SubmitButton>{club ? "Save club" : "Create club"}</SubmitButton>
    </ActionForm>
  );
}
