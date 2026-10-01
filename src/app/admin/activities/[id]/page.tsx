import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { AdminTitle, Created } from "@/components/admin";
import { Card } from "@/components/ui";
import { ActivityForm } from "../ActivityForm";
import { programmeOptions } from "../options";

export const metadata = { title: "Edit activity" };

export default async function EditActivity({ params, searchParams }: PageProps<"/admin/activities/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const activity = await db.activity.findUnique({ where: { id }, include: { events: { orderBy: { startsAt: "asc" } } } });
  if (!activity) notFound();
  if (!can(user, "content.manage", activity.clubId)) redirect("/admin/activities");
  const o = await programmeOptions(user, "content.manage");
  return (
    <>
      <AdminTitle title={activity.title} back={{ href: "/admin/activities", label: "Activities" }} action={<Link href={`/activities/${id}`} className="text-sm text-brand-700 underline">View public page →</Link>} />
      <Created show={!!sp.created} label="Activity created" />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <ActivityForm activity={activity} clubs={o.clubs} initiatives={o.initiatives} partners={o.partners} />
        <Card>
          <h2 className="font-display text-xl font-semibold">Events in this activity</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {activity.events.map((e) => <li key={e.id}><Link href={`/admin/events/${e.id}`} className="font-medium hover:underline">{e.title}</Link><p className="text-xs text-muted">{formatDateTime(e.startsAt)}</p></li>)}
          </ul>
          <Link href={`/admin/events/new?activity=${activity.id}&club=${activity.clubId}`} className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">+ Schedule an event</Link>
        </Card>
      </div>
    </>
  );
}
