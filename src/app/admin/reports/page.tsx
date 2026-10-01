import { db } from "@/lib/db";
import { isChapterAdmin, requireAdmin } from "@/lib/permissions";
import { AdminTitle } from "@/components/admin";
import { Card } from "@/components/ui";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function Reports() {
  const user = await requireAdmin();
  const ids = isChapterAdmin(user) ? null : [...new Set(user.clubRoles.map((r) => r.clubId))];
  const clubFilter = ids ? { clubId: { in: ids } } : {};
  const now = new Date();

  // Pilot funnel: registration → joining → event registration → attendance → return participation
  const [registered, joined, regUsers, attended] = await Promise.all([
    ids ? db.user.count({ where: { memberships: { some: { ...clubFilter } } } }) : db.user.count(),
    db.clubMembership.findMany({ where: { status: "ACTIVE", ...clubFilter }, distinct: ["userId"], select: { userId: true } }),
    db.eventRegistration.findMany({ where: { status: { not: "CANCELLED" }, event: clubFilter }, distinct: ["userId"], select: { userId: true } }),
    db.eventAttendance.groupBy({ by: ["userId"], where: { event: clubFilter }, _count: true }),
  ]);
  const steps = [
    { label: "Registered on platform", value: registered },
    { label: "Joined ≥ 1 club", value: joined.length },
    { label: "Registered for an event", value: regUsers.length },
    { label: "Attended (checked in)", value: attended.length },
    { label: "Returned (≥ 2 check-ins)", value: attended.filter((a) => a._count >= 2).length },
  ];
  const top = Math.max(1, steps[0].value);

  // Monthly activity (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 1), label: d.toLocaleString("en-GB", { month: "short" }) };
  });
  const monthly = await Promise.all(
    months.map(async (m) => ({
      label: m.label,
      members: await db.clubMembership.count({ where: { ...clubFilter, status: "ACTIVE", joinedAt: { gte: m.start, lt: m.end } } }),
      events: await db.event.count({ where: { ...clubFilter, status: "PUBLISHED", startsAt: { gte: m.start, lt: m.end } } }),
      checkins: await db.eventAttendance.count({ where: { event: clubFilter, checkedInAt: { gte: m.start, lt: m.end } } }),
    })),
  );
  const maxM = Math.max(1, ...monthly.map((m) => Math.max(m.members, m.checkins)));

  return (
    <>
      <AdminTitle title="Reports" subtitle="Pilot measurement and data exports." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl font-semibold">Engagement funnel</h2>
          <p className="text-sm text-muted">registration → joining → event registration → attendance → return participation</p>
          <ol className="mt-5 space-y-3">
            {steps.map((s, i) => (
              <li key={s.label}>
                <div className="flex justify-between text-sm"><span>{s.label}</span><span className="font-semibold">{s.value}{i > 0 && <span className="ml-1 text-xs font-normal text-muted">({Math.round((s.value / top) * 100)}%)</span>}</span></div>
                <div className="mt-1 h-3 rounded-full bg-brand-50"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(s.value / top) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <h2 className="font-display text-xl font-semibold">Last 6 months</h2>
          <table className="mt-4 w-full text-sm">
            <caption className="sr-only">New members, events and check-ins per month</caption>
            <thead className="text-xs text-muted"><tr><th scope="col" className="text-left">Month</th><th scope="col" className="text-left">New members / check-ins</th><th scope="col" className="text-right">Events</th></tr></thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.label}>
                  <th scope="row" className="py-1.5 text-left font-medium">{m.label}</th>
                  <td className="py-1.5">
                    <div className="flex items-center gap-2"><div className="h-2 rounded bg-brand-600" style={{ width: `${(m.members / maxM) * 70}%` }} /><span className="text-xs">{m.members}</span></div>
                    <div className="mt-0.5 flex items-center gap-2"><div className="h-2 rounded bg-gold-400" style={{ width: `${(m.checkins / maxM) * 70}%` }} /><span className="text-xs">{m.checkins}</span></div>
                  </td>
                  <td className="py-1.5 text-right">{m.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 flex gap-4 text-xs text-muted"><span><span className="mr-1 inline-block h-2 w-3 rounded bg-brand-600" />new members</span><span><span className="mr-1 inline-block h-2 w-3 rounded bg-gold-400" />check-ins</span></p>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-display text-xl font-semibold">Exports (CSV)</h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {[["members", "Members & memberships"], ["registrations", "Event registrations"], ["attendance", "Attendance"], ["clubs", "Club summary"]].map(([t, l]) => (
            <li key={t}><a href={`/api/admin/export?type=${t}`} className="inline-block rounded-full border border-brand-200 px-4 py-2 font-semibold text-brand-800 hover:bg-brand-50">{l}</a></li>
          ))}
        </ul>
      </Card>
    </>
  );
}
