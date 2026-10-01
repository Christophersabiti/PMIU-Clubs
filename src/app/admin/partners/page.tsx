import Link from "next/link";
import { db } from "@/lib/db";
import { requireChapterAdmin } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { AdminTitle, NewButton, Table, td } from "@/components/admin";
import { Badge } from "@/components/ui";

export const metadata = { title: "Partners" };

export default async function AdminPartners() {
  await requireChapterAdmin();
  const partners = await db.partner.findMany({ orderBy: { name: "asc" }, include: { clubs: { include: { club: true } }, _count: { select: { activities: true, events: true, resources: true } } } });
  return (
    <>
      <AdminTitle title="Partners" subtitle="One partner can support multiple clubs. Link partners to clubs from each club's page." action={<NewButton href="/admin/partners/new">Add partner</NewButton>} />
      <Table head={["Partner", "Clubs", "Expertise", "Contact", "Active since", "Status"]}>
        {partners.map((p) => (
          <tr key={p.id}>
            <td className={td}><Link href={`/admin/partners/${p.id}`} className="font-semibold text-brand-800 hover:underline">{p.name}</Link><p className="text-xs text-muted">{p._count.activities} activities · {p._count.events} events · {p._count.resources} resources</p></td>
            <td className={td}>{p.clubs.map((c) => c.club.shortName).join(", ") || "—"}</td>
            <td className={td}><span className="line-clamp-2 text-xs">{p.expertise?.split("\n").join(", ")}</span></td>
            <td className={td}><span className="text-xs">{p.contactName}<br />{p.contactEmail}</span></td>
            <td className={td}>{formatDate(p.activeSince)}</td>
            <td className={td}><Badge tone={p.status === "ACTIVE" ? "green" : p.status === "PROSPECT" ? "gold" : "gray"}>{p.status.toLowerCase()}</Badge></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
