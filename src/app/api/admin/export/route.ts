import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { clubsWith, hasAdminAccess } from "@/lib/permissions";
import { audit } from "@/lib/audit";

function csv(rows: (string | number | boolean | null | undefined | Date)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          let s = v instanceof Date ? v.toISOString() : String(v ?? "");
          if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // guard against CSV formula injection
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasAdminAccess(user)) return new Response("Forbidden", { status: 403 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const eventId = url.searchParams.get("event");
  const ids = clubsWith(user, type === "attendance" || type === "registrations" ? "attendance.manage" : "members.manage");
  const clubFilter = ids ? { clubId: { in: ids } } : {};
  let rows: (string | number | boolean | null | undefined | Date)[][] = [];

  if (type === "members") {
    const ms = await db.clubMembership.findMany({ where: clubFilter, include: { user: true, club: true }, orderBy: { createdAt: "asc" } });
    rows = [["name", "email", "phone", "organization", "job_title", "pmi_member", "pmi_id", "certifications", "club", "status", "joined_at"],
      ...ms.map((m) => [m.user.name, m.user.email, m.user.phone, m.user.organization, m.user.jobTitle, m.user.isPmiMember, m.user.pmiMemberId, m.user.certifications, m.club.shortName, m.status, m.joinedAt])];
  } else if (type === "registrations") {
    const rs = await db.eventRegistration.findMany({ where: { event: { ...clubFilter, ...(eventId ? { id: eventId } : {}) } }, include: { user: true, event: { include: { club: true } } } });
    rows = [["event", "club", "starts_at", "name", "email", "status", "registered_at"], ...rs.map((r) => [r.event.title, r.event.club.shortName, r.event.startsAt, r.user.name, r.user.email, r.status, r.createdAt])];
  } else if (type === "attendance") {
    const as = await db.eventAttendance.findMany({ where: { event: { ...clubFilter, ...(eventId ? { id: eventId } : {}) } }, include: { user: true, event: { include: { club: true } } } });
    rows = [["event", "club", "starts_at", "name", "email", "checked_in_at", "method"], ...as.map((a) => [a.event.title, a.event.club.shortName, a.event.startsAt, a.user.name, a.user.email, a.checkedInAt, a.method])];
  } else if (type === "clubs") {
    const cs = await db.club.findMany({ where: ids ? { id: { in: ids } } : {}, include: { _count: { select: { memberships: { where: { status: "ACTIVE" } }, events: true, activities: true } } } });
    rows = [["club", "active_members", "activities", "events", "target", "target_label"], ...cs.map((c) => [c.name, c._count.memberships, c._count.activities, c._count.events, c.targetValue, c.targetLabel])];
  } else return new Response("Unknown export", { status: 400 });

  await audit(user.id, "report.export", "Export", type, { eventId });
  return new Response(csv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="pmi-clubs-${type}-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
