import "server-only";
import { db } from "./db";
import { eventHours } from "./utils";

export async function memberEngagement(userId: string) {
  const [clubsJoined, registered, attendance] = await Promise.all([
    db.clubMembership.count({ where: { userId, status: "ACTIVE" } }),
    db.eventRegistration.count({ where: { userId, status: { not: "CANCELLED" } } }),
    db.eventAttendance.findMany({
      where: { userId },
      include: { event: { select: { startsAt: true, endsAt: true, impactHours: true, isVolunteer: true, partnerId: true, activity: { select: { isVolunteer: true } } } } },
    }),
  ]);
  const volunteer = attendance.filter((a) => a.event.isVolunteer || a.event.activity?.isVolunteer);
  return {
    clubsJoined,
    registered,
    attended: attendance.length,
    volunteer: volunteer.length,
    impactHours: Math.round(attendance.reduce((s, a) => s + eventHours(a.event), 0) * 10) / 10,
    partnerEngagements: attendance.filter((a) => a.event.partnerId).length,
  };
}

async function metricSum(metric: string, clubId?: string) {
  const r = await db.impactMetric.aggregate({ where: { metric, ...(clubId ? { clubId } : {}) }, _sum: { value: true } });
  return r._sum.value ?? 0;
}

/** Volunteer hours earned through attendance at volunteer events plus manually recorded hours. */
async function volunteerHours(clubId?: string) {
  const att = await db.eventAttendance.findMany({
    where: { event: { ...(clubId ? { clubId } : {}), OR: [{ isVolunteer: true }, { activity: { isVolunteer: true } }] } },
    include: { event: { select: { startsAt: true, endsAt: true, impactHours: true } } },
  });
  return att.reduce((s, a) => s + eventHours(a.event), 0) + (await metricSum("VOLUNTEER_HOURS", clubId));
}

export async function impactSummary() {
  const now = new Date();
  const [membersInClubs, attendees, activities, pastEvents, partners, projectActivities] = await Promise.all([
    db.clubMembership.findMany({ where: { status: "ACTIVE" }, select: { userId: true }, distinct: ["userId"] }),
    db.eventAttendance.findMany({ select: { userId: true }, distinct: ["userId"] }),
    db.activity.count(),
    db.event.count({ where: { endsAt: { lt: now }, status: "PUBLISHED" } }),
    db.partner.count({ where: { status: "ACTIVE" } }),
    db.activity.count({ where: { type: "PROJECT" } }),
  ]);
  const participants = new Set([...membersInClubs.map((m) => m.userId), ...attendees.map((a) => a.userId)]).size;
  return {
    participants,
    activities: activities + pastEvents,
    communityProjects: Math.max(projectActivities, await metricSum("COMMUNITY_PROJECTS")),
    volunteerHours: Math.round(await volunteerHours()),
    partners,
    peopleImpacted: await metricSum("PEOPLE_IMPACTED"),
  };
}

export async function clubImpact(clubId: string) {
  const now = new Date();
  const [members, attendance, completedActivities, pastEvents, metrics] = await Promise.all([
    db.clubMembership.count({ where: { clubId, status: "ACTIVE" } }),
    db.eventAttendance.count({ where: { event: { clubId } } }),
    db.activity.count({ where: { clubId, status: "COMPLETED" } }),
    db.event.count({ where: { clubId, endsAt: { lt: now }, status: "PUBLISHED" } }),
    db.impactMetric.findMany({ where: { clubId }, orderBy: { recordedAt: "desc" } }),
  ]);
  const byMetric = new Map<string, { label: string; value: number }>();
  for (const m of metrics) {
    const cur = byMetric.get(m.metric);
    byMetric.set(m.metric, { label: cur?.label ?? m.label, value: (cur?.value ?? 0) + m.value });
  }
  return {
    members,
    attendance,
    activitiesDelivered: completedActivities + pastEvents,
    volunteerHours: Math.round(await volunteerHours(clubId)),
    metrics: [...byMetric.entries()].map(([metric, v]) => ({ metric, ...v })),
  };
}

export async function targetProgress(club: { id: string; targetMetric: string | null; targetNumber: number | null }) {
  if (!club.targetMetric || !club.targetNumber) return null;
  let current = 0;
  const now = new Date();
  switch (club.targetMetric) {
    case "MEMBERS": {
      // members engaged = distinct attendees of club events, falling back to active members
      const att = await db.eventAttendance.findMany({ where: { event: { clubId: club.id } }, select: { userId: true }, distinct: ["userId"] });
      current = att.length || (await db.clubMembership.count({ where: { clubId: club.id, status: "ACTIVE" } }));
      break;
    }
    case "ACTIVITIES":
    case "SESSIONS":
      current =
        (await db.event.count({ where: { clubId: club.id, endsAt: { lt: now }, status: "PUBLISHED" } })) +
        (await db.activity.count({ where: { clubId: club.id, status: "COMPLETED", events: { none: {} } } }));
      break;
    case "COACHES":
      current = await metricSum("COACHES_TRAINED", club.id);
      break;
    case "PROJECTS":
      current = await metricSum("COMMUNITY_PROJECTS", club.id);
      break;
  }
  return { current, target: club.targetNumber, pct: Math.min(100, Math.round((current / club.targetNumber) * 100)) };
}

export async function platformAnalytics(clubIds: string[] | null) {
  const clubFilter = clubIds ? { clubId: { in: clubIds } } : {};
  // For club-scoped dashboards, "users" means people connected to those clubs
  const userFilter = clubIds ? { memberships: { some: { clubId: { in: clubIds } } } } : {};
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400_000);

  const [totalUsers, activeUsers, newUsers, memberships, registrations, attendance, pending, clubs, eventsHeld, resourcesDownloads, postViews] =
    await Promise.all([
      db.user.count({ where: userFilter }),
      db.user.count({ where: { ...userFilter, lastActiveAt: { gte: d30 } } }),
      db.user.count({ where: { ...userFilter, createdAt: { gte: d30 } } }),
      db.clubMembership.findMany({ where: { status: "ACTIVE", ...clubFilter }, select: { userId: true, clubId: true } }),
      db.eventRegistration.findMany({ where: { status: { not: "CANCELLED" }, event: clubFilter }, select: { userId: true, eventId: true } }),
      db.eventAttendance.findMany({ where: { event: clubFilter }, select: { userId: true, eventId: true } }),
      db.clubMembership.count({ where: { status: "PENDING", ...clubFilter } }),
      db.club.findMany({ where: clubIds ? { id: { in: clubIds } } : {}, orderBy: { sortOrder: "asc" } }),
      db.event.count({ where: { endsAt: { lt: now }, status: "PUBLISHED", ...clubFilter } }),
      db.resource.aggregate({ where: clubFilter, _sum: { downloads: true } }),
      db.post.aggregate({ where: { type: "ANNOUNCEMENT", ...clubFilter }, _sum: { views: true } }),
    ]);

  const usersInClubs = new Set(memberships.map((m) => m.userId));
  const perUser = new Map<string, number>();
  memberships.forEach((m) => perUser.set(m.userId, (perUser.get(m.userId) ?? 0) + 1));
  const multiClub = [...perUser.values()].filter((n) => n > 1).length;

  const attendedPerUser = new Map<string, number>();
  attendance.forEach((a) => attendedPerUser.set(a.userId, (attendedPerUser.get(a.userId) ?? 0) + 1));
  const returning = [...attendedPerUser.values()].filter((n) => n >= 2).length;

  // Attendance rate only over registrations for events that have already happened
  const pastEventIds = new Set(
    (await db.event.findMany({ where: { endsAt: { lt: now }, ...clubFilter }, select: { id: true } })).map((e) => e.id),
  );
  const pastRegs = registrations.filter((r) => pastEventIds.has(r.eventId));
  const attendedKeys = new Set(attendance.map((a) => `${a.eventId}:${a.userId}`));
  const pastRegsAttended = pastRegs.filter((r) => attendedKeys.has(`${r.eventId}:${r.userId}`)).length;

  const clubRows = await Promise.all(
    clubs.map(async (c) => ({
      id: c.id,
      name: c.shortName,
      accent: c.accent,
      members: memberships.filter((m) => m.clubId === c.id).length,
      registrations: await db.eventRegistration.count({ where: { status: { not: "CANCELLED" }, event: { clubId: c.id } } }),
      attendance: await db.eventAttendance.count({ where: { event: { clubId: c.id } } }),
      progress: await targetProgress(c),
      targetLabel: c.targetLabel,
      targetValue: c.targetValue,
    })),
  );

  const regUsers = new Set(registrations.map((r) => r.userId)).size;

  return {
    membership: { totalUsers, activeUsers, newUsers, clubMembers: usersInClubs.size, multiClub, pending },
    engagement: {
      registrations: registrations.length,
      attendance: attendance.length,
      attendanceRate: pastRegs.length ? Math.round((pastRegsAttended / pastRegs.length) * 100) : null,
      activitiesPerMember: usersInClubs.size ? Math.round((attendance.length / usersInClubs.size) * 10) / 10 : 0,
      returning,
      eventsHeld,
      resourcesDownloads: resourcesDownloads._sum.downloads ?? 0,
      announcementViews: postViews._sum.views ?? 0,
    },
    kpis: {
      clubActivationRate: totalUsers ? Math.round((usersInClubs.size / totalUsers) * 100) : 0,
      monthlyActiveMembers: activeUsers,
      eventRegistrationRate: usersInClubs.size ? Math.round((regUsers / usersInClubs.size) * 100) : 0,
      attendanceRate: pastRegs.length ? Math.round((pastRegsAttended / pastRegs.length) * 100) : null,
      repeatParticipationRate: attendedPerUser.size ? Math.round((returning / attendedPerUser.size) * 100) : 0,
    },
    clubs: clubRows.sort((a, b) => b.members + b.attendance - (a.members + a.attendance)),
  };
}
