import { db } from "@/lib/db";
import { requireChapterAdmin } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { AdminTitle, Table, td } from "@/components/admin";

export const metadata = { title: "Audit log" };

export default async function Audit() {
  await requireChapterAdmin();
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { actor: true } });
  return (
    <>
      <AdminTitle title="Audit log" subtitle="Latest 200 administrative and member actions." />
      <Table head={["When", "Actor", "Action", "Entity", "Details"]} empty={logs.length === 0}>
        {logs.map((l) => (
          <tr key={l.id}>
            <td className={`${td} whitespace-nowrap`}>{formatDateTime(l.createdAt)}</td>
            <td className={td}>{l.actor?.name ?? "system"}</td>
            <td className={td}><code className="text-xs">{l.action}</code></td>
            <td className={td}>{l.entity}{l.entityId && <span className="block font-mono text-[10px] text-muted">{l.entityId}</span>}</td>
            <td className={td}><span className="line-clamp-2 font-mono text-[11px] text-muted">{l.details}</span></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
