import { db } from "@/lib/db";
import { clubScope, isChapterAdmin, manageableClubs, requireAdmin } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { deleteImpact, recordImpact } from "@/app/actions/admin";
import { AdminTitle, Table, td } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Input, Select, Textarea } from "@/components/ui";

export const metadata = { title: "Impact" };

const METRICS = [
  { value: "PEOPLE_IMPACTED", label: "People impacted" },
  { value: "COMMUNITY_PROJECTS", label: "Community projects supported" },
  { value: "COACHES_TRAINED", label: "Members trained as coaches" },
  { value: "MENTORSHIP_CONNECTIONS", label: "Mentorship connections" },
  { value: "PROFESSIONALS_REACHED", label: "Professionals reached" },
  { value: "VOLUNTEER_HOURS", label: "Volunteer hours (off-platform)" },
  { value: "BENEFITS_SECURED", label: "Member benefits secured" },
  { value: "OTHER", label: "Other (custom label)" },
];

export default async function AdminImpact() {
  const user = await requireAdmin();
  const [items, clubs] = await Promise.all([
    db.impactMetric.findMany({ where: clubScope(user, "club.edit"), include: { club: true }, orderBy: { recordedAt: "desc" } }),
    manageableClubs(user, "club.edit"),
  ]);
  return (
    <>
      <AdminTitle title="Community impact" subtitle="Attendance and volunteer hours are captured automatically from check-ins. Record outcomes that happen off-platform here." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Table head={["Metric", "Club", "Value", "Period", "Recorded", ""]} empty={items.length === 0}>
          {items.map((m) => (
            <tr key={m.id}>
              <td className={td}><p className="font-semibold">{m.label}</p>{m.note && <p className="text-xs text-muted">{m.note}</p>}</td>
              <td className={td}>{m.club?.shortName ?? "Chapter"}</td>
              <td className={td}>{m.value}</td>
              <td className={td}>{m.period}</td>
              <td className={td}>{formatDate(m.recordedAt)}</td>
              <td className={td}><form action={deleteImpact}><input type="hidden" name="id" value={m.id} /><button className="text-xs text-red-700 underline">Delete</button></form></td>
            </tr>
          ))}
        </Table>
        <Card>
          <h2 className="font-display text-xl font-semibold">Record impact</h2>
          <ActionForm action={recordImpact} className="mt-4 space-y-3" resetOnSuccess>
            <Select label="Club" name="clubId" options={clubs.map((c) => ({ value: c.id, label: c.shortName }))} placeholder={isChapterAdmin(user) ? "Chapter-wide" : undefined} required={!isChapterAdmin(user)} />
            <Select label="Metric" name="metric" options={METRICS} />
            <Input label="Custom label (optional)" name="label" />
            <Input label="Value" name="value" type="number" step="any" required />
            <Input label="Period" name="period" placeholder="Nov 2026" />
            <Textarea label="Note / evidence" name="note" rows={2} />
            <SubmitButton size="sm">Record</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
