import type { Gallery } from "@prisma/client";
import { saveGallery } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Checkbox, Input, Select, Textarea } from "@/components/ui";

export function GalleryForm({ gallery, clubs, events }: { gallery?: Gallery; clubs: { id: string; shortName: string }[]; events: { id: string; label: string }[] }) {
  return (
    <ActionForm action={saveGallery}>
      <Card className="grid gap-4 sm:grid-cols-2">
        {gallery && <input type="hidden" name="id" value={gallery.id} />}
        <div className="sm:col-span-2"><Input label="Title" name="title" defaultValue={gallery?.title} required placeholder="Toastmasters Leadership Workshop" /></div>
        <Select label="Club" name="clubId" defaultValue={gallery?.clubId ?? ""} required options={clubs.map((c) => ({ value: c.id, label: c.shortName }))} />
        <Select label="Event" name="eventId" defaultValue={gallery?.eventId ?? ""} placeholder="— none —" options={events.map((e) => ({ value: e.id, label: e.label }))} />
        <div className="sm:col-span-2"><Textarea label="Description" name="description" defaultValue={gallery?.description ?? ""} rows={2} /></div>
        <Checkbox name="published" label="Published" defaultChecked={gallery?.published ?? true} />
        <div className="sm:col-span-2"><SubmitButton size="sm">{gallery ? "Save details" : "Create gallery"}</SubmitButton></div>
      </Card>
    </ActionForm>
  );
}
