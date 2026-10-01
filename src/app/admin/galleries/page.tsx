import Link from "next/link";
import { db } from "@/lib/db";
import { clubScope, requireAdmin } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { AdminTitle, NewButton, Table, td } from "@/components/admin";
import { Badge } from "@/components/ui";

export const metadata = { title: "Galleries" };

export default async function AdminGalleries() {
  const user = await requireAdmin();
  const items = await db.gallery.findMany({ where: clubScope(user, "content.manage"), include: { club: true, event: true, _count: { select: { images: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <AdminTitle title="Photo galleries" subtitle="Upload → Caption → Select club → Select event → Publish" action={<NewButton href="/admin/galleries/new">New gallery</NewButton>} />
      <Table head={["Gallery", "Club", "Event", "Photos", "Created", "Status"]} empty={items.length === 0}>
        {items.map((g) => (
          <tr key={g.id}>
            <td className={td}><Link href={`/admin/galleries/${g.id}`} className="font-semibold text-brand-800 hover:underline">{g.title}</Link></td>
            <td className={td}>{g.club?.shortName}</td>
            <td className={td}>{g.event?.title ?? "—"}</td>
            <td className={td}>{g._count.images}</td>
            <td className={td}>{formatDate(g.createdAt)}</td>
            <td className={td}>{g.published ? <Badge tone="green">published</Badge> : <Badge tone="gray">draft</Badge>}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
