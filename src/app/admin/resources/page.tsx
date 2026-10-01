import Link from "next/link";
import { db } from "@/lib/db";
import { clubsWith, isChapterAdmin, manageableClubs, requireAdmin } from "@/lib/permissions";
import { deleteResource, saveResource } from "@/app/actions/admin";
import { RESOURCE_TYPES } from "@/components/cards";
import { AdminTitle, Table, td } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Card, Checkbox, Field, Input, Select, Textarea, inputCls } from "@/components/ui";

export const metadata = { title: "Resources" };

export default async function AdminResources({ searchParams }: PageProps<"/admin/resources">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const ids = clubsWith(user, "partnerContent.manage");
  const [items, clubs, partners] = await Promise.all([
    db.resource.findMany({ where: ids ? { clubId: { in: ids } } : {}, include: { club: true, partner: true }, orderBy: { createdAt: "desc" } }),
    manageableClubs(user, "partnerContent.manage"),
    db.partner.findMany({ orderBy: { name: "asc" } }),
  ]);
  const editing = sp.edit ? items.find((r) => r.id === sp.edit) : undefined;
  return (
    <>
      <AdminTitle title="Resources" subtitle="Links, videos, templates and PDF documents." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Table head={["Resource", "Type", "Club", "Opens", ""]} empty={items.length === 0}>
          {items.map((r) => (
            <tr key={r.id}>
              <td className={td}><p className="font-semibold">{r.title}</p><div className="mt-1 flex gap-1">{!r.published && <Badge tone="gray">draft</Badge>}{r.membersOnly && <Badge tone="brand">members only</Badge>}{r.isPartnerResource && <Badge tone="gold">{r.partner?.name ?? "partner"}</Badge>}</div></td>
              <td className={td}>{r.mediaId ? "PDF" : RESOURCE_TYPES[r.type]}</td>
              <td className={td}>{r.club?.shortName ?? "All"}</td>
              <td className={td}>{r.downloads}</td>
              <td className={td}>
                <div className="flex gap-3">
                  <Link href={`/admin/resources?edit=${r.id}`} className="text-brand-700 underline">Edit</Link>
                  <form action={deleteResource}><input type="hidden" name="id" value={r.id} /><button className="text-red-700 underline">Delete</button></form>
                </div>
              </td>
            </tr>
          ))}
        </Table>
        <Card>
          <h2 className="font-display text-xl font-semibold">{editing ? "Edit resource" : "Add resource"}</h2>
          <ActionForm key={editing?.id ?? "new"} action={saveResource} className="mt-4 space-y-3" resetOnSuccess={!editing}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Input label="Title" name="title" defaultValue={editing?.title} required />
            <Textarea label="Description" name="description" defaultValue={editing?.description ?? ""} rows={2} />
            <Select label="Club" name="clubId" defaultValue={editing?.clubId ?? ""} options={clubs.map((c) => ({ value: c.id, label: c.shortName }))} placeholder={isChapterAdmin(user) ? "All clubs" : undefined} required={!isChapterAdmin(user)} />
            <Select label="Type" name="type" defaultValue={editing?.type ?? "LINK"} options={Object.entries(RESOURCE_TYPES).map(([value, label]) => ({ value, label }))} />
            <Input label="Link URL" name="url" type="url" defaultValue={editing?.url ?? ""} hint="Or upload a PDF below" />
            <Field label="PDF document" name="file" hint="PDF only, max 4 MB"><input id="file" name="file" type="file" accept="application/pdf" className={inputCls} /></Field>
            <Select label="Partner" name="partnerId" defaultValue={editing?.partnerId ?? ""} placeholder="— none —" options={partners.map((p) => ({ value: p.id, label: p.name }))} />
            <Checkbox name="membersOnly" label="Members only" defaultChecked={editing?.membersOnly} />
            <Checkbox name="published" label="Published" defaultChecked={editing?.published ?? true} />
            <div className="flex gap-3"><SubmitButton size="sm">{editing ? "Save" : "Add"}</SubmitButton>{editing && <Link href="/admin/resources" className="self-center text-sm underline">Cancel</Link>}</div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
