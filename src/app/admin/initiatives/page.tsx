import Link from "next/link";
import { db } from "@/lib/db";
import { clubScope, manageableClubs, requireAdmin } from "@/lib/permissions";
import { formatDate, toLocalInput } from "@/lib/utils";
import { saveInitiative } from "@/app/actions/admin";
import { AdminTitle, Table, td } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Card, Input, Select, Textarea } from "@/components/ui";

export const metadata = { title: "Initiatives" };

export default async function Initiatives({ searchParams }: PageProps<"/admin/initiatives">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const [clubs, items] = await Promise.all([
    manageableClubs(user, "content.manage"),
    db.initiative.findMany({ where: clubScope(user, "content.manage"), include: { club: true, _count: { select: { activities: true, events: true } } }, orderBy: [{ club: { sortOrder: "asc" } }, { startDate: "asc" }] }),
  ]);
  const editing = sp.edit ? items.find((i) => i.id === sp.edit) : undefined;
  const statuses = [{ value: "PLANNED", label: "Planned" }, { value: "ACTIVE", label: "Active" }, { value: "COMPLETED", label: "Completed" }];

  return (
    <>
      <AdminTitle title="Initiatives" subtitle="Longer-running programmes. Club → Initiative → Activities → Events." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Table head={["Initiative", "Club", "Dates", "Activities", "Status", ""]} empty={items.length === 0}>
          {items.map((i) => (
            <tr key={i.id}>
              <td className={td}><p className="font-semibold">{i.title}</p><p className="line-clamp-1 text-xs text-muted">{i.description}</p></td>
              <td className={td}>{i.club.shortName}</td>
              <td className={td}>{formatDate(i.startDate)}{i.endDate && ` – ${formatDate(i.endDate)}`}</td>
              <td className={td}>{i._count.activities}</td>
              <td className={td}><Badge tone={i.status === "ACTIVE" ? "green" : "gray"}>{i.status.toLowerCase()}</Badge></td>
              <td className={td}><Link href={`/admin/initiatives?edit=${i.id}`} className="text-brand-700 underline">Edit</Link></td>
            </tr>
          ))}
        </Table>
        <Card>
          <h2 className="font-display text-xl font-semibold">{editing ? "Edit initiative" : "New initiative"}</h2>
          <ActionForm key={editing?.id ?? "new"} action={saveInitiative} className="mt-4 space-y-3" resetOnSuccess={!editing}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Select label="Club" name="clubId" defaultValue={editing?.clubId} options={clubs.map((c) => ({ value: c.id, label: c.shortName }))} required />
            <Input label="Title" name="title" defaultValue={editing?.title} required placeholder="Workplace Wellness Initiative" />
            <Textarea label="Description" name="description" defaultValue={editing?.description ?? ""} rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start" name="startDate" type="date" defaultValue={editing?.startDate ? toLocalInput(editing.startDate).slice(0, 10) : ""} />
              <Input label="End" name="endDate" type="date" defaultValue={editing?.endDate ? toLocalInput(editing.endDate).slice(0, 10) : ""} />
            </div>
            <Select label="Status" name="status" defaultValue={editing?.status ?? "ACTIVE"} options={statuses} />
            <div className="flex gap-3"><SubmitButton size="sm">{editing ? "Save" : "Create"}</SubmitButton>{editing && <Link href="/admin/initiatives" className="self-center text-sm underline">Cancel</Link>}</div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
