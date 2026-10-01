import type { Event } from "@prisma/client";
import { saveEvent } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Checkbox, Field, Input, Select, Textarea, inputCls } from "@/components/ui";
import { toLocalInput } from "@/lib/utils";

type Opt = { id: string; label: string };
export function EventForm({ event, clubs, initiatives, activities, partners, defaults }: {
  event?: Event; clubs: Opt[]; initiatives: Opt[]; activities: Opt[]; partners: Opt[]; defaults?: { clubId?: string; activityId?: string };
}) {
  return (
    <ActionForm action={saveEvent} className="space-y-6">
      {event && <input type="hidden" name="id" value={event.id} />}
      <Card className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Event title" name="title" defaultValue={event?.title} required placeholder="Saturday Morning Run" /></div>
        <Select label="Club" name="clubId" defaultValue={event?.clubId ?? defaults?.clubId} required options={clubs.map((c) => ({ value: c.id, label: c.label }))} />
        <Select label="Status" name="status" defaultValue={event?.status ?? "PUBLISHED"} options={[{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft (hidden)" }, { value: "CANCELLED", label: "Cancelled — notifies registrants" }]} />
        <Select label="Initiative" name="initiativeId" defaultValue={event?.initiativeId ?? ""} placeholder="— none —" options={initiatives.map((i) => ({ value: i.id, label: i.label }))} />
        <Select label="Activity" name="activityId" defaultValue={event?.activityId ?? defaults?.activityId ?? ""} placeholder="— none —" options={activities.map((i) => ({ value: i.id, label: i.label }))} />
        <div className="sm:col-span-2"><Input label="Summary" name="summary" defaultValue={event?.summary ?? ""} maxLength={240} /></div>
        <div className="sm:col-span-2"><Textarea label="Description" name="description" defaultValue={event?.description ?? ""} rows={5} /></div>
        <Field label="Banner image" name="bannerFile" hint="Defaults to the club cover image"><input id="bannerFile" name="bannerFile" type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} /></Field>
        <Input label="Facilitator" name="facilitator" defaultValue={event?.facilitator ?? ""} />
      </Card>
      <Card className="grid gap-4 sm:grid-cols-2">
        <p className="font-display text-lg font-semibold sm:col-span-2">Date, time & place <span className="text-sm font-normal text-muted">(Kampala time)</span></p>
        <Input label="Starts" name="startsAt" type="datetime-local" defaultValue={toLocalInput(event?.startsAt)} required />
        <Input label="Ends" name="endsAt" type="datetime-local" defaultValue={toLocalInput(event?.endsAt)} required />
        <Select label="Format" name="mode" defaultValue={event?.mode ?? "PHYSICAL"} options={[{ value: "PHYSICAL", label: "In person" }, { value: "ONLINE", label: "Online" }, { value: "HYBRID", label: "Hybrid" }]} />
        <Input label="Location" name="locationName" defaultValue={event?.locationName ?? ""} placeholder="Kololo Independence Grounds" />
        <Input label="Google Maps link" name="mapUrl" type="url" defaultValue={event?.mapUrl ?? ""} />
        <Input label="Online meeting link" name="onlineUrl" type="url" defaultValue={event?.onlineUrl ?? ""} hint="Shown only to registered members" />
      </Card>
      <Card className="grid gap-4 sm:grid-cols-2">
        <p className="font-display text-lg font-semibold sm:col-span-2">Registration & impact</p>
        <Input label="Capacity" name="capacity" type="number" min={1} defaultValue={event?.capacity ?? ""} hint="Leave empty for unlimited. Extra registrations go to a waitlist." />
        <Input label="Registration deadline" name="registrationDeadline" type="datetime-local" defaultValue={toLocalInput(event?.registrationDeadline)} />
        <Select label="Partner" name="partnerId" defaultValue={event?.partnerId ?? ""} placeholder="— none —" options={partners.map((p) => ({ value: p.id, label: p.label }))} />
        <Input label="External registration link" name="externalRegistrationUrl" type="url" defaultValue={event?.externalRegistrationUrl ?? ""} hint="Optional — replaces on-platform registration" />
        <Input label="Impact hours per attendee" name="impactHours" type="number" step="0.5" min={0} defaultValue={event?.impactHours ?? ""} hint="Defaults to the event duration" />
        <div className="self-end"><Checkbox name="isVolunteer" label="Volunteer activity" defaultChecked={event?.isVolunteer} /></div>
        {!event && <div className="sm:col-span-2"><Checkbox name="announce" label="Notify club members about this new event (in-app + email)" defaultChecked /></div>}
      </Card>
      <SubmitButton>{event ? "Save event" : "Create event"}</SubmitButton>
    </ActionForm>
  );
}
