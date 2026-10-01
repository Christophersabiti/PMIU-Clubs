import Link from "next/link";
import { db } from "@/lib/db";
import { can, isChapterAdmin, requireAdmin } from "@/lib/permissions";
import { AdminTitle, NewButton, Table, td } from "@/components/admin";
import { Badge } from "@/components/ui";

export const metadata = { title: "Clubs" };

export default async function AdminClubs() {
  const user = await requireAdmin();
  const clubs = await db.club.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { memberships: { where: { status: "ACTIVE" } }, events: true, activities: true } }, roles: { where: { role: "CLUB_LEAD" }, include: { user: true } } },
  });
  return (
    <>
      <AdminTitle title="Clubs" subtitle="Clubs are configuration, not architecture — add new ones any time." action={isChapterAdmin(user) && <NewButton href="/admin/clubs/new">Create club</NewButton>} />
      <Table head={["Club", "Captain", "Members", "Activities", "Events", "Status", ""]}>
        {clubs.map((c) => (
          <tr key={c.id}>
            <td className={td}><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: c.accent }} /><span className="font-semibold">{c.name}</span></td>
            <td className={td}>{c.roles.map((r) => r.user.name).join(", ") || <span className="text-muted">Unassigned</span>}</td>
            <td className={td}>{c._count.memberships}</td>
            <td className={td}>{c._count.activities}</td>
            <td className={td}>{c._count.events}</td>
            <td className={td}>{c.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Hidden</Badge>}</td>
            <td className={td}>
              {can(user, "club.edit", c.id) ? <Link href={`/admin/clubs/${c.id}`} className="font-semibold text-brand-700 underline">Manage</Link> : <Link href={`/clubs/${c.slug}`} className="text-muted underline">View</Link>}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
