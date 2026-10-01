import Link from "next/link";
import { db } from "@/lib/db";
import { clubScope, requireAdmin } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { AdminTitle, NewButton, Table, td } from "@/components/admin";
import { Badge } from "@/components/ui";

export const metadata = { title: "Events" };

export default async function AdminEvents({ searchParams }: PageProps<"/admin/events">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const now = new Date();
  const past = sp.when === "past";
  const events = await db.event.findMany({
    where: { ...clubScope(user, "events.manage"), endsAt: past ? { lt: now } : { gte: now } },
    include: { club: true, _count: { select: { registrations: { where: { status: "REGISTERED" } }, attendance: true } } },
    orderBy: { startsAt: past ? "desc" : "asc" },
  });
  return (
    <>
      <AdminTitle title="Events" action={<NewButton href="/admin/events/new">Create event</NewButton>} />
      <div className="mb-4 flex gap-2 text-sm">
        <Link href="/admin/events" className={!past ? "font-semibold text-brand-800 underline" : "text-muted"}>Upcoming</Link>
        <Link href="/admin/events?when=past" className={past ? "font-semibold text-brand-800 underline" : "text-muted"}>Past</Link>
      </div>
      <Table head={["Event", "Club", "When", "Registered", "Checked in", "Status", ""]} empty={events.length === 0}>
        {events.map((e) => (
          <tr key={e.id}>
            <td className={td}><Link href={`/admin/events/${e.id}`} className="font-semibold text-brand-800 hover:underline">{e.title}</Link></td>
            <td className={td}>{e.club.shortName}</td>
            <td className={td}>{formatDateTime(e.startsAt)}</td>
            <td className={td}>{e._count.registrations}{e.capacity ? ` / ${e.capacity}` : ""}</td>
            <td className={td}>{e._count.attendance}</td>
            <td className={td}><Badge tone={e.status === "PUBLISHED" ? "green" : e.status === "CANCELLED" ? "red" : "gray"}>{e.status.toLowerCase()}</Badge></td>
            <td className={td}><Link href={`/admin/events/${e.id}/attendance`} className="text-brand-700 underline">Attendance</Link></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
