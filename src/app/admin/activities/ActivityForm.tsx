import type { Activity } from "@prisma/client";
import { saveActivity } from "@/app/actions/admin";
import { ACTIVITY_TYPES } from "@/components/cards";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Checkbox, Field, Input, Select, Textarea, inputCls } from "@/components/ui";
import { toLocalInput } from "@/lib/utils";

type Opt = { id: string; label: string };
export function ActivityForm({ activity, clubs, initiatives, partners }: { activity?: Activity; clubs: Opt[]; initiatives: (Opt & { clubId: string })[]; partners: Opt[] }) {
  return (
    <ActionForm action={saveActivity} className="space-y-6">
      {activity && <input type="hidden" name="id" value={activity.id} />}
      <Card className="grid gap-4 sm:grid-cols-2">
        <Select label="Club" name="clubId" defaultValue={activity?.clubId} required options={clubs.map((c) => ({ value: c.id, label: c.label }))} />
        <Select label="Initiative" name="initiativeId" defaultValue={activity?.initiativeId ?? ""} placeholder="— none —" options={initiatives.map((i) => ({ value: i.id, label: i.label }))} hint="Must belong to the selected club" />
        <div className="sm:col-span-2"><Input label="Title" name="title" defaultValue={activity?.title} required placeholder="Monthly Fitness Challenge" /></div>
        <div className="sm:col-span-2"><Input label="Summary" name="summary" defaultValue={activity?.summary ?? ""} maxLength={240} /></div>
        <div className="sm:col-span-2"><Textarea label="Description" name="description" defaultValue={activity?.description ?? ""} rows={5} /></div>
        <Select label="Type" name="type" defaultValue={activity?.type ?? "SESSION"} options={Object.entries(ACTIVITY_TYPES).map(([value, label]) => ({ value, label }))} />
        <Select label="Status" name="status" defaultValue={activity?.status ?? "PLANNED"} options={[{ value: "PLANNED", label: "Planned" }, { value: "ACTIVE", label: "Active" }, { value: "COMPLETED", label: "Completed" }]} />
        <Input label="Start date" name="startDate" type="date" defaultValue={activity?.startDate ? toLocalInput(activity.startDate).slice(0, 10) : ""} />
        <Input label="End date" name="endDate" type="date" defaultValue={activity?.endDate ? toLocalInput(activity.endDate).slice(0, 10) : ""} />
        <Select label="Partner" name="partnerId" defaultValue={activity?.partnerId ?? ""} placeholder="— none —" options={partners.map((p) => ({ value: p.id, label: p.label }))} />
        <Field label="Cover image" name="coverFile"><input id="coverFile" name="coverFile" type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} /></Field>
        <div className="sm:col-span-2"><Checkbox name="isVolunteer" label="Volunteer / community-impact activity" hint="Attendance counts toward volunteer and impact hours" defaultChecked={activity?.isVolunteer} /></div>
      </Card>
      <SubmitButton>{activity ? "Save activity" : "Create activity"}</SubmitButton>
    </ActionForm>
  );
}
