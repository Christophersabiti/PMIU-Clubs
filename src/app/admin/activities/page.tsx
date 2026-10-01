import Link from "next/link";
import { db } from "@/lib/db";
import { clubScope, requireAdmin } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { ACTIVITY_TYPES } from "@/components/cards";
import { AdminTitle, NewButton, Table, td } from "@/components/admin";
import { Badge } from "@/components/ui";

export const metadata = { title: "Activities" };

export default async function AdminActivities() {
  const user = await requireAdmin();
  const items = await db.activity.findMany({ where: clubScope(user, "content.manage"), include: { club: true, initiative: true, _count: { select: { events: true } } }, orderBy: [{ startDate: "asc" }] });
  return (
    <>
      <AdminTitle title="Activities" subtitle="Things members do — challenges, trainings, sessions and community projects." action={<NewButton href="/admin/activities/new">New activity</NewButton>} />
      <Table head={["Activity", "Club / initiative", "Type", "Starts", "Events", "Status"]} empty={items.length === 0}>
        {items.map((a) => (
          <tr key={a.id}>
            <td className={td}><Link href={`/admin/activities/${a.id}`} className="font-semibold text-brand-800 hover:underline">{a.title}</Link>{a.isVolunteer && <Badge tone="gold" className="ml-2">volunteer</Badge>}</td>
            <td className={td}>{a.club.shortName}<p className="text-xs text-muted">{a.initiative?.title}</p></td>
            <td className={td}>{ACTIVITY_TYPES[a.type]}</td>
            <td className={td}>{formatDate(a.startDate)}</td>
            <td className={td}>{a._count.events}</td>
            <td className={td}><Badge tone={a.status === "ACTIVE" ? "green" : a.status === "COMPLETED" ? "gray" : "brand"}>{a.status.toLowerCase()}</Badge></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
