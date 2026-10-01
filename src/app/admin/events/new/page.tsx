import { requireAdmin } from "@/lib/permissions";
import { AdminTitle } from "@/components/admin";
import { programmeOptions } from "../../activities/options";
import { EventForm } from "../EventForm";

export const metadata = { title: "Create event" };

export default async function NewEvent({ searchParams }: PageProps<"/admin/events/new">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const o = await programmeOptions(user, "events.manage");
  return (
    <>
      <AdminTitle title="Create event" back={{ href: "/admin/events", label: "Events" }} />
      <EventForm {...o} defaults={{ clubId: sp.club, activityId: sp.activity }} />
    </>
  );
}
