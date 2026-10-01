import Link from "next/link";
import { db } from "@/lib/db";
import { clubScope, isChapterAdmin, requireAdmin } from "@/lib/permissions";
import { impactSummary, platformAnalytics } from "@/lib/stats";
import { formatDateTime } from "@/lib/utils";
import { AdminTitle } from "@/components/admin";
import { Card, Progress, Stat } from "@/components/ui";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint: string }) {
  return (
    <div className="rounded-2xl bg-brand-950 p-4 text-white">
      <p className="text-xs font-medium text-brand-200">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-gold-400">{value}</p>
      <p className="mt-0.5 text-[11px] text-brand-300">{hint}</p>
    </div>
  );
}

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const user = await requireAdmin();
  const chapter = isChapterAdmin(user);
  const scopeIds = chapter ? null : [...new Set(user.clubRoles.map((r) => r.clubId))];
  const now = new Date();
  const [a, impact, upcoming, pending] = await Promise.all([
    platformAnalytics(scopeIds),
    impactSummary(),
    db.event.findMany({ where: { endsAt: { gte: now }, status: "PUBLISHED", ...(scopeIds ? { clubId: { in: scopeIds } } : {}) }, orderBy: { startsAt: "asc" }, take: 5, include: { club: true, _count: { select: { registrations: { where: { status: "REGISTERED" } } } } } }),
    db.clubMembership.findMany({ where: { status: "PENDING", ...clubScope(user, "members.manage") }, include: { user: true, club: true }, take: 5 }),
  ]);
  const maxBar = Math.max(1, ...a.clubs.map((c) => c.members + c.attendance));

  return (
    <>
      {sp.denied && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">That area needs chapter admin access.</p>}
      <AdminTitle title={chapter ? "Chapter dashboard" : "Club dashboard"} subtitle={chapter ? "Real-time view across all PMI Uganda clubs." : `Scoped to your club${scopeIds && scopeIds.length > 1 ? "s" : ""}.`} />

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Primary KPIs</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Club activation rate" value={`${a.kpis.clubActivationRate}%`} hint="registered users in ≥1 club" />
        <Kpi label="Monthly active members" value={a.kpis.monthlyActiveMembers} hint="signed in last 30 days" />
        <Kpi label="Event registration rate" value={`${a.kpis.eventRegistrationRate}%`} hint="club members who registered" />
        <Kpi label="Attendance rate" value={a.kpis.attendanceRate === null ? "—" : `${a.kpis.attendanceRate}%`} hint="past registrations checked in" />
        <Kpi label="Repeat participation" value={`${a.kpis.repeatParticipationRate}%`} hint="attendees with ≥2 check-ins" />
        <Kpi label="People impacted" value={impact.peopleImpacted} hint={`${impact.volunteerHours} volunteer hours`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl font-semibold">Membership</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat value={a.membership.totalUsers} label="Registered users" />
            <Stat value={a.membership.activeUsers} label="Active (30 days)" />
            <Stat value={a.membership.clubMembers} label="Club members" />
            <Stat value={a.membership.newUsers} label="New (30 days)" />
            <Stat value={a.membership.multiClub} label="Multi-club members" />
            <Stat value={a.membership.pending} label="Pending requests" />
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-xl font-semibold">Engagement</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat value={a.engagement.registrations} label="Event registrations" />
            <Stat value={a.engagement.attendance} label="Check-ins" />
            <Stat value={a.engagement.eventsHeld} label="Events held" />
            <Stat value={a.engagement.activitiesPerMember} label="Activities / member" />
            <Stat value={a.engagement.returning} label="Returning participants" />
            <Stat value={a.engagement.resourcesDownloads} label="Resource opens" hint={`${a.engagement.announcementViews} announcement views`} />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-xl font-semibold">Club performance</h2>
        <p className="text-sm text-muted">Members + check-ins, and progress to the 31 December 2026 pilot targets.</p>
        <ul className="mt-5 space-y-5">
          {a.clubs.map((c) => (
            <li key={c.id} className="grid gap-2 md:grid-cols-[160px_1fr_1fr] md:items-center">
              <p className="font-semibold">{c.name}</p>
              <div>
                <div className="flex h-6 overflow-hidden rounded-md bg-brand-50" aria-hidden>
                  <div style={{ width: `${(c.members / maxBar) * 100}%`, background: c.accent }} />
                  <div style={{ width: `${(c.attendance / maxBar) * 100}%`, background: c.accent, opacity: 0.45 }} />
                </div>
                <p className="mt-1 text-xs text-muted">{c.members} members · {c.registrations} registrations · {c.attendance} check-ins</p>
              </div>
              <div>
                {c.progress ? (
                  <>
                    <Progress pct={c.progress.pct} color={c.accent} label={`${c.name} target progress`} />
                    <p className="mt-1 text-xs text-muted">Target {c.targetValue} {c.targetLabel}: {c.progress.current}/{c.progress.target} ({c.progress.pct}%)</p>
                  </>
                ) : <p className="text-xs text-muted">No numeric target set</p>}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Upcoming events</h2><Link href="/admin/events" className="text-sm text-brand-700 underline">Manage</Link></div>
          <ul className="mt-3 divide-y divide-brand-100">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div><Link href={`/admin/events/${e.id}/attendance`} className="font-medium hover:underline">{e.title}</Link><p className="text-xs text-muted">{e.club.shortName} · {formatDateTime(e.startsAt)}</p></div>
                <span className="whitespace-nowrap text-xs font-semibold">{e._count.registrations}{e.capacity ? ` / ${e.capacity}` : ""}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Join requests</h2><Link href="/admin/applications" className="text-sm text-brand-700 underline">Review all</Link></div>
          {pending.length === 0 && <p className="mt-3 text-sm text-muted">No pending requests.</p>}
          <ul className="mt-3 divide-y divide-brand-100">
            {pending.map((m) => <li key={m.id} className="py-2.5 text-sm"><span className="font-medium">{m.user.name}</span> → {m.club.shortName}</li>)}
          </ul>
        </Card>
      </div>
    </>
  );
}
