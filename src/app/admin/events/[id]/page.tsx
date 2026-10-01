import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/permissions";
import { deleteEvent } from "@/app/actions/admin";
import { AdminTitle, Created } from "@/components/admin";
import { btn } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { programmeOptions } from "../../activities/options";
import { EventForm } from "../EventForm";

export const metadata = { title: "Edit event" };

export default async function EditEvent({ params, searchParams }: PageProps<"/admin/events/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();
  if (!can(user, "events.manage", event.clubId)) redirect("/admin/events");
  const o = await programmeOptions(user, "events.manage");
  return (
    <>
      <AdminTitle title={event.title} back={{ href: "/admin/events", label: "Events" }} action={
        <div className="flex gap-3 text-sm">
          <Link href={`/admin/events/${id}/attendance`} className="font-semibold text-brand-700 underline">Attendance</Link>
          <Link href={`/events/${id}`} className="text-brand-700 underline">Public page →</Link>
        </div>
      } />
      <Created show={!!sp.created} label="Event created" />
      <EventForm event={event} {...o} />
      <form action={deleteEvent} className="mt-10 border-t border-brand-100 pt-6">
        <input type="hidden" name="id" value={id} />
        <p className="mb-2 text-sm text-muted">Deleting removes the event, registrations and attendance permanently. Prefer “Cancelled” status to keep history.</p>
        <ConfirmButton message="Permanently delete this event and its registrations?" className={`${btn.base} ${btn.danger} ${btn.sm}`}>Delete event</ConfirmButton>
      </form>
    </>
  );
}
