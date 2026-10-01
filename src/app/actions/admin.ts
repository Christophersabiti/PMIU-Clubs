"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notifyClub, notifyUser } from "@/lib/notify";
import { esc } from "@/lib/mail";
import { assertCan, CLUB_ROLES, GLOBAL_ROLES, isChapterAdmin, isSuperAdmin, type Capability } from "@/lib/permissions";
import { deleteStoredFile } from "@/lib/storage";
import { storeUpload, UploadError } from "@/lib/upload";
import { bool, formatDateTime, fromLocalInput, optFloat, optInt, optStr, slugify, str } from "@/lib/utils";
import type { ActionState } from "@/components/forms";

/* ─── helpers ─────────────────────────────────────────────────────────── */

async function chapterAdmin() {
  const user = await getCurrentUser();
  if (!user || !isChapterAdmin(user)) throw new Error("Chapter admin access required.");
  return user;
}

/** Wraps an action so permission/validation errors are returned as form messages. */
function guarded(fn: (fd: FormData) => Promise<ActionState | void>) {
  return async (_prev: ActionState, fd: FormData): Promise<ActionState> => {
    try {
      return (await fn(fd)) ?? { success: "Saved.", ts: Date.now() };
    } catch (e) {
      if (e instanceof UploadError) return { error: e.message };
      // let Next.js redirects/notFound propagate
      if (e && typeof e === "object" && "digest" in e) throw e;
      return { error: e instanceof Error ? e.message : "Something went wrong." };
    }
  };
}

/** For edits: user must hold the capability on the row's current club and the target club. */
async function canOnBoth(cap: Capability, currentClubId: string | null | undefined, nextClubId: string | null | undefined) {
  const user = await assertCan(cap, currentClubId);
  if (nextClubId !== currentClubId) await assertCan(cap, nextClubId);
  return user;
}

async function uniqueSlug(base: string, exists: (s: string) => Promise<boolean>) {
  const root = slugify(base) || "item";
  let s = root;
  for (let i = 2; await exists(s); i++) s = `${root}-${i}`;
  return s;
}

/* ─── Clubs ───────────────────────────────────────────────────────────── */

const saveClubImpl = async (fd: FormData) => {
  const id = optStr(fd, "id");
  const user = id ? await assertCan("club.edit", id) : await chapterAdmin();
  const name = str(fd, "name");
  if (name.length < 3) return { error: "Club name is required." };
  const cover = await storeUpload(fd.get("coverFile"), { userId: user.id, clubId: id, accept: ["IMAGE"] });
  const data = {
    name,
    shortName: str(fd, "shortName") || name,
    tagline: optStr(fd, "tagline"),
    focus: optStr(fd, "focus"),
    summary: optStr(fd, "summary"),
    description: optStr(fd, "description"),
    vision: optStr(fd, "vision"),
    gains: optStr(fd, "gains"),
    programme: optStr(fd, "programme"),
    accent: /^#[0-9a-f]{6}$/i.test(str(fd, "accent")) ? str(fd, "accent") : "#7c3aed",
    icon: str(fd, "icon") || "users",
    coverImage: cover ? `/api/media/${cover.id}` : optStr(fd, "coverImage"),
    whatsappUrl: optStr(fd, "whatsappUrl"),
    requiresApproval: bool(fd, "requiresApproval"),
    targetValue: optStr(fd, "targetValue"),
    targetLabel: optStr(fd, "targetLabel"),
    targetNumber: optInt(fd, "targetNumber"),
    targetMetric: optStr(fd, "targetMetric"),
    targetDeadline: fromLocalInput(fd.get("targetDeadline")),
    sortOrder: optInt(fd, "sortOrder") ?? 0,
  };
  if (id) {
    // only chapter admins may deactivate a club
    const active = isChapterAdmin(user) ? bool(fd, "active") : undefined;
    await db.club.update({ where: { id }, data: { ...data, ...(active !== undefined ? { active } : {}) } });
    await audit(user.id, "club.update", "Club", id);
  } else {
    const slug = await uniqueSlug(str(fd, "slug") || data.shortName, async (s) => !!(await db.club.findUnique({ where: { slug: s } })));
    const club = await db.club.create({ data: { ...data, slug, active: true } });
    await audit(user.id, "club.create", "Club", club.id);
    redirect(`/admin/clubs/${club.id}?created=1`);
  }
  revalidatePath("/", "layout");
};
export const saveClub = guarded(saveClubImpl);

export const assignClubRole = guarded(async (fd) => {
  const admin = await chapterAdmin();
  const clubId = str(fd, "clubId");
  const role = str(fd, "role");
  if (!(CLUB_ROLES as readonly string[]).includes(role)) return { error: "Invalid role." };
  const target = await db.user.findUnique({ where: { email: str(fd, "email").toLowerCase() } });
  if (!target) return { error: "No user with that email. They must create an account first." };
  await db.clubRole.upsert({
    where: { userId_clubId_role: { userId: target.id, clubId, role } },
    create: { userId: target.id, clubId, role, title: optStr(fd, "title") },
    update: { title: optStr(fd, "title") },
  });
  await db.clubMembership.upsert({
    where: { userId_clubId: { userId: target.id, clubId } },
    create: { userId: target.id, clubId, status: "ACTIVE", joinedAt: new Date() },
    update: { status: "ACTIVE" },
  });
  await audit(admin.id, "club.role_assign", "Club", clubId, { user: target.email, role });
  await notifyUser(target.id, { title: "You've been given a club role", body: `${role.replace(/_/g, " ").toLowerCase()} — you can now use the Admin Portal.`, link: "/admin", kind: "INFO" });
  revalidatePath(`/admin/clubs/${clubId}`);
  return { success: `${target.name} assigned.` };
});

export async function removeClubRole(fd: FormData) {
  const admin = await chapterAdmin();
  const id = str(fd, "id");
  const r = await db.clubRole.delete({ where: { id } });
  await audit(admin.id, "club.role_remove", "Club", r.clubId, { userId: r.userId, role: r.role });
  revalidatePath(`/admin/clubs/${r.clubId}`);
}

export const linkClubPartner = guarded(async (fd) => {
  const clubId = str(fd, "clubId");
  const user = await assertCan("club.edit", clubId);
  const partnerId = str(fd, "partnerId");
  const data = { relationship: optStr(fd, "relationship"), provides: optStr(fd, "provides"), memberBenefit: optStr(fd, "memberBenefit") };
  await db.clubPartner.upsert({ where: { clubId_partnerId: { clubId, partnerId } }, create: { clubId, partnerId, ...data }, update: data });
  await audit(user.id, "club.partner_link", "Club", clubId, { partnerId });
  revalidatePath(`/admin/clubs/${clubId}`);
  return { success: "Partner linked." };
});

export async function unlinkClubPartner(fd: FormData) {
  const id = str(fd, "id");
  const cp = await db.clubPartner.findUniqueOrThrow({ where: { id } });
  const user = await assertCan("club.edit", cp.clubId);
  await db.clubPartner.delete({ where: { id } });
  await audit(user.id, "club.partner_unlink", "Club", cp.clubId, { partnerId: cp.partnerId });
  revalidatePath(`/admin/clubs/${cp.clubId}`);
}

/* ─── Memberships ─────────────────────────────────────────────────────── */

export async function decideMembership(fd: FormData) {
  const id = str(fd, "id");
  const decision = str(fd, "decision"); // ACTIVE | REJECTED | REMOVED
  const m = await db.clubMembership.findUniqueOrThrow({ where: { id }, include: { club: true } });
  const user = await assertCan("members.manage", m.clubId);
  const status = decision === "ACTIVE" ? "ACTIVE" : decision === "REMOVED" ? "LEFT" : "REJECTED";
  await db.clubMembership.update({ where: { id }, data: { status, decidedById: user.id, joinedAt: status === "ACTIVE" ? new Date() : m.joinedAt } });
  await audit(user.id, `membership.${decision.toLowerCase()}`, "ClubMembership", id);
  if (decision !== "REMOVED") {
    await notifyUser(
      m.userId,
      {
        title: status === "ACTIVE" ? `You're in! Welcome to ${m.club.name}` : `Update on your ${m.club.name} request`,
        body: status === "ACTIVE" ? "Your membership was approved." : "Your request was not approved this time.",
        link: `/clubs/${m.club.slug}`,
        kind: "MEMBERSHIP",
      },
      {
        subject: status === "ACTIVE" ? `Membership approved — ${m.club.name}` : `Your ${m.club.name} request`,
        html: status === "ACTIVE" ? `<p>Your request to join <strong>${esc(m.club.name)}</strong> was approved.</p>` : `<p>Your request to join <strong>${esc(m.club.name)}</strong> was not approved at this time. Please contact the Club Captain for details.</p>`,
        cta: "Open club",
        template: "membership_decision",
      },
    );
  }
  revalidatePath("/admin/applications");
  revalidatePath("/admin/members");
}

export const setGlobalRole = guarded(async (fd) => {
  // Platform roles are managed only by the platform (super) administrator.
  const admin = await chapterAdmin();
  if (!isSuperAdmin(admin)) return { error: "Only the platform administrator can change platform roles." };
  const userId = str(fd, "userId");
  const role = str(fd, "role");
  if (!(GLOBAL_ROLES as readonly string[]).includes(role)) return { error: "Invalid role." };
  const target = await db.user.findUniqueOrThrow({ where: { id: userId } });
  // only super admins can grant or revoke super admin
  if ((role === "SUPER_ADMIN" || target.globalRole === "SUPER_ADMIN") && !isSuperAdmin(admin)) return { error: "Only a Super Admin can change Super Admin access." };
  if (target.id === admin.id) return { error: "You cannot change your own role." };
  await db.user.update({ where: { id: userId }, data: { globalRole: role } });
  await audit(admin.id, "user.role_change", "User", userId, { from: target.globalRole, to: role });
  revalidatePath("/admin/members");
  return { success: "Role updated." };
});

/* ─── Initiatives & Activities ────────────────────────────────────────── */

export const saveInitiative = guarded(async (fd) => {
  const id = optStr(fd, "id");
  const clubId = str(fd, "clubId");
  const existing = id ? await db.initiative.findUniqueOrThrow({ where: { id } }) : null;
  const user = await canOnBoth("content.manage", existing?.clubId ?? clubId, clubId);
  const data = {
    clubId,
    title: str(fd, "title"),
    description: optStr(fd, "description"),
    startDate: fromLocalInput(fd.get("startDate")),
    endDate: fromLocalInput(fd.get("endDate")),
    status: str(fd, "status") || "ACTIVE",
  };
  if (!data.title) return { error: "Title is required." };
  const row = id ? await db.initiative.update({ where: { id }, data }) : await db.initiative.create({ data });
  await audit(user.id, id ? "initiative.update" : "initiative.create", "Initiative", row.id);
  revalidatePath("/admin/initiatives");
  if (!id) return { success: "Initiative created." };
});

export const saveActivity = guarded(async (fd) => {
  const id = optStr(fd, "id");
  const clubId = str(fd, "clubId");
  const existing = id ? await db.activity.findUniqueOrThrow({ where: { id } }) : null;
  const user = await canOnBoth("content.manage", existing?.clubId ?? clubId, clubId);
  const cover = await storeUpload(fd.get("coverFile"), { userId: user.id, clubId, accept: ["IMAGE"] });
  const data = {
    clubId,
    initiativeId: optStr(fd, "initiativeId"),
    partnerId: optStr(fd, "partnerId"),
    title: str(fd, "title"),
    summary: optStr(fd, "summary"),
    description: optStr(fd, "description"),
    type: str(fd, "type") || "SESSION",
    status: str(fd, "status") || "PLANNED",
    isVolunteer: bool(fd, "isVolunteer"),
    startDate: fromLocalInput(fd.get("startDate")),
    endDate: fromLocalInput(fd.get("endDate")),
    ...(cover ? { coverImage: `/api/media/${cover.id}` } : {}),
  };
  if (!data.title) return { error: "Title is required." };
  if (data.initiativeId) {
    const ini = await db.initiative.findUnique({ where: { id: data.initiativeId } });
    if (ini?.clubId !== clubId) return { error: "The initiative must belong to the same club." };
  }
  const row = id ? await db.activity.update({ where: { id }, data }) : await db.activity.create({ data });
  await audit(user.id, id ? "activity.update" : "activity.create", "Activity", row.id);
  revalidatePath("/activities");
  if (!id) redirect(`/admin/activities/${row.id}?created=1`);
});

/* ─── Events ──────────────────────────────────────────────────────────── */

export const saveEvent = guarded(async (fd) => {
  const id = optStr(fd, "id");
  const clubId = str(fd, "clubId");
  const existing = id ? await db.event.findUniqueOrThrow({ where: { id } }) : null;
  const user = await canOnBoth("events.manage", existing?.clubId ?? clubId, clubId);
  const startsAt = fromLocalInput(fd.get("startsAt"));
  const endsAt = fromLocalInput(fd.get("endsAt"));
  if (!str(fd, "title")) return { error: "Event title is required." };
  if (!startsAt || !endsAt) return { error: "Start and end time are required." };
  if (endsAt <= startsAt) return { error: "End time must be after the start time." };
  const banner = await storeUpload(fd.get("bannerFile"), { userId: user.id, clubId, accept: ["IMAGE"] });
  const activityId = optStr(fd, "activityId");
  let initiativeId = optStr(fd, "initiativeId");
  if (activityId) {
    const act = await db.activity.findUnique({ where: { id: activityId } });
    if (act?.clubId !== clubId) return { error: "The activity must belong to the same club." };
    initiativeId = initiativeId ?? act.initiativeId;
  }
  const status = str(fd, "status") || "PUBLISHED";
  const data = {
    clubId,
    initiativeId,
    activityId,
    partnerId: optStr(fd, "partnerId"),
    title: str(fd, "title"),
    summary: optStr(fd, "summary"),
    description: optStr(fd, "description"),
    startsAt,
    endsAt,
    locationName: optStr(fd, "locationName"),
    mapUrl: optStr(fd, "mapUrl"),
    mode: str(fd, "mode") || "PHYSICAL",
    onlineUrl: optStr(fd, "onlineUrl"),
    capacity: optInt(fd, "capacity"),
    registrationDeadline: fromLocalInput(fd.get("registrationDeadline")),
    facilitator: optStr(fd, "facilitator"),
    externalRegistrationUrl: optStr(fd, "externalRegistrationUrl"),
    status,
    isVolunteer: bool(fd, "isVolunteer"),
    impactHours: optFloat(fd, "impactHours"),
    ...(banner ? { bannerUrl: `/api/media/${banner.id}` } : !existing ? { bannerUrl: (await db.club.findUnique({ where: { id: clubId } }))?.coverImage ?? null } : {}),
  };
  const row = id ? await db.event.update({ where: { id }, data }) : await db.event.create({ data });
  await audit(user.id, id ? "event.update" : "event.create", "Event", row.id);

  // Cancellation → notify registrants
  if (existing && existing.status !== "CANCELLED" && status === "CANCELLED") {
    const regs = await db.eventRegistration.findMany({ where: { eventId: row.id, status: { not: "CANCELLED" } } });
    for (const r of regs) {
      await notifyUser(
        r.userId,
        { title: `Cancelled: ${row.title}`, body: formatDateTime(row.startsAt), link: `/events/${row.id}`, kind: "EVENT" },
        { subject: `Event cancelled — ${row.title}`, html: `<p>We're sorry — <strong>${esc(row.title)}</strong> on ${esc(formatDateTime(row.startsAt))} has been cancelled.</p>`, cta: "View event", template: "event_cancelled" },
      );
    }
  }
  // New published event → notify club members
  if (!existing && status === "PUBLISHED" && bool(fd, "announce")) {
    await notifyClub(clubId, { title: `New event: ${row.title}`, body: formatDateTime(row.startsAt), link: `/events/${row.id}`, kind: "EVENT" }, "event_new", "View & register");
  }
  revalidatePath("/events");
  revalidatePath(`/events/${row.id}`);
  if (!id) redirect(`/admin/events/${row.id}?created=1`);
});

export async function deleteEvent(fd: FormData) {
  const id = str(fd, "id");
  const e = await db.event.findUniqueOrThrow({ where: { id } });
  const user = await assertCan("events.manage", e.clubId);
  await db.event.delete({ where: { id } });
  await audit(user.id, "event.delete", "Event", id, { title: e.title });
  revalidatePath("/events");
  redirect("/admin/events");
}

/* ─── Attendance / QR check-in ────────────────────────────────────────── */

export type CheckInResult = (NonNullable<ActionState> & { name?: string; event?: string; already?: boolean }) | undefined;

export async function checkInByCode(_prev: CheckInResult, fd: FormData): Promise<CheckInResult> {
  const raw = str(fd, "code");
  // accept either the bare code or the full check-in URL
  const code = raw.includes("code=") ? new URL(raw, "http://x").searchParams.get("code") ?? "" : raw;
  const reg = await db.eventRegistration.findUnique({ where: { ticketCode: code }, include: { user: true, event: true } });
  if (!reg) return { error: "Ticket not found. Check the code and try again." };
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  try {
    await assertCan("attendance.manage", reg.event.clubId);
  } catch {
    return { error: "You are not authorised to check in attendees for this club." };
  }
  if (reg.status !== "REGISTERED") return { error: `${reg.user.name}'s registration is ${reg.status.toLowerCase()}.`, name: reg.user.name, event: reg.event.title };
  const existing = await db.eventAttendance.findUnique({ where: { eventId_userId: { eventId: reg.eventId, userId: reg.userId } } });
  if (existing) return { success: "Already checked in.", already: true, name: reg.user.name, event: reg.event.title };
  await db.eventAttendance.create({ data: { eventId: reg.eventId, userId: reg.userId, checkedInById: user.id, method: "QR" } });
  await audit(user.id, "attendance.checkin", "Event", reg.eventId, { userId: reg.userId, method: "QR" });
  return { success: "Checked in ✓", name: reg.user.name, event: reg.event.title, ts: Date.now() };
}

export async function toggleAttendance(fd: FormData) {
  const eventId = str(fd, "eventId");
  const userId = str(fd, "userId");
  const e = await db.event.findUniqueOrThrow({ where: { id: eventId } });
  const user = await assertCan("attendance.manage", e.clubId);
  const existing = await db.eventAttendance.findUnique({ where: { eventId_userId: { eventId, userId } } });
  if (existing) {
    await db.eventAttendance.delete({ where: { id: existing.id } });
    await audit(user.id, "attendance.undo", "Event", eventId, { userId });
  } else {
    await db.eventAttendance.create({ data: { eventId, userId, checkedInById: user.id, method: "MANUAL" } });
    await audit(user.id, "attendance.checkin", "Event", eventId, { userId, method: "MANUAL" });
  }
  revalidatePath(`/admin/events/${eventId}/attendance`);
}

/** Walk-in: check in a member who did not register, by email. */
export const walkInCheckIn = guarded(async (fd) => {
  const eventId = str(fd, "eventId");
  const e = await db.event.findUniqueOrThrow({ where: { id: eventId } });
  const user = await assertCan("attendance.manage", e.clubId);
  const member = await db.user.findUnique({ where: { email: str(fd, "email").toLowerCase() } });
  if (!member) return { error: "No account with that email." };
  await db.eventAttendance.upsert({
    where: { eventId_userId: { eventId, userId: member.id } },
    create: { eventId, userId: member.id, checkedInById: user.id, method: "MANUAL" },
    update: {},
  });
  await audit(user.id, "attendance.walkin", "Event", eventId, { userId: member.id });
  revalidatePath(`/admin/events/${eventId}/attendance`);
  return { success: `${member.name} checked in.` };
});

/* ─── Partners ────────────────────────────────────────────────────────── */

export const savePartner = guarded(async (fd) => {
  const user = await chapterAdmin();
  const id = optStr(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Partner name is required." };
  const logo = await storeUpload(fd.get("logoFile"), { userId: user.id, accept: ["IMAGE"] });
  const data = {
    name,
    description: optStr(fd, "description"),
    expertise: optStr(fd, "expertise"),
    website: optStr(fd, "website"),
    contactName: optStr(fd, "contactName"),
    contactEmail: optStr(fd, "contactEmail"),
    contactPhone: optStr(fd, "contactPhone"),
    activeSince: fromLocalInput(fd.get("activeSince")),
    status: str(fd, "status") || "ACTIVE",
    ...(logo ? { logoUrl: `/api/media/${logo.id}` } : {}),
  };
  if (id) {
    await db.partner.update({ where: { id }, data });
    await audit(user.id, "partner.update", "Partner", id);
  } else {
    const slug = await uniqueSlug(name, async (s) => !!(await db.partner.findUnique({ where: { slug: s } })));
    const p = await db.partner.create({ data: { ...data, slug } });
    await audit(user.id, "partner.create", "Partner", p.id);
    redirect(`/admin/partners/${p.id}?created=1`);
  }
  revalidatePath("/partners");
});

/* ─── Posts (news, announcements, impact stories) ─────────────────────── */

export const savePost = guarded(async (fd) => {
  const id = optStr(fd, "id");
  const clubId = optStr(fd, "clubId");
  const existing = id ? await db.post.findUniqueOrThrow({ where: { id } }) : null;
  const type = str(fd, "type") || "NEWS";
  // Partner reps may publish news/resources for their club; announcements need content rights.
  const cap: Capability = type === "NEWS" ? "partnerContent.manage" : "content.manage";
  const user = await canOnBoth(cap, existing ? existing.clubId : clubId, clubId);
  const cover = await storeUpload(fd.get("coverFile"), { userId: user.id, clubId, accept: ["IMAGE"] });
  const title = str(fd, "title");
  const body = str(fd, "body");
  if (!title || !body) return { error: "Title and body are required." };
  const published = bool(fd, "published");
  const data = {
    clubId,
    type,
    title,
    excerpt: optStr(fd, "excerpt"),
    body,
    youtubeUrl: optStr(fd, "youtubeUrl"),
    published,
    publishedAt: published ? existing?.publishedAt ?? new Date() : null,
    ...(cover ? { coverImage: `/api/media/${cover.id}` } : {}),
  };
  const row = existing
    ? await db.post.update({ where: { id: existing.id }, data })
    : await db.post.create({ data: { ...data, authorId: user.id, slug: await uniqueSlug(title, async (s) => !!(await db.post.findUnique({ where: { slug: s } }))) } });
  await audit(user.id, existing ? "post.update" : "post.create", "Post", row.id);
  const firstPublish = published && (!existing || !existing.published);
  if (firstPublish && type === "ANNOUNCEMENT") {
    await notifyClub(clubId, { title: row.title, body: row.excerpt ?? undefined, link: `/news/${row.slug}`, kind: "ANNOUNCEMENT" }, "announcement", "Read more");
  }
  revalidatePath("/news");
  revalidatePath("/");
  if (!existing) redirect(`/admin/posts/${row.id}?created=1`);
});

export async function deletePost(fd: FormData) {
  const p = await db.post.findUniqueOrThrow({ where: { id: str(fd, "id") } });
  const user = await assertCan(p.type === "NEWS" ? "partnerContent.manage" : "content.manage", p.clubId);
  await db.post.delete({ where: { id: p.id } });
  await audit(user.id, "post.delete", "Post", p.id, { title: p.title });
  revalidatePath("/news");
  redirect("/admin/posts");
}

/* ─── Resources ───────────────────────────────────────────────────────── */

export const saveResource = guarded(async (fd) => {
  const id = optStr(fd, "id");
  const clubId = optStr(fd, "clubId");
  const existing = id ? await db.resource.findUniqueOrThrow({ where: { id } }) : null;
  const user = await canOnBoth("partnerContent.manage", existing ? existing.clubId : clubId, clubId);
  const file = await storeUpload(fd.get("file"), { userId: user.id, clubId, accept: ["DOCUMENT"] });
  const url = optStr(fd, "url");
  if (!file && !url && !existing?.mediaId) return { error: "Provide a link or upload a PDF." };
  const data = {
    clubId,
    partnerId: optStr(fd, "partnerId"),
    title: str(fd, "title"),
    description: optStr(fd, "description"),
    type: file ? "DOCUMENT" : str(fd, "type") || "LINK",
    url,
    isPartnerResource: bool(fd, "isPartnerResource") || !!optStr(fd, "partnerId"),
    membersOnly: bool(fd, "membersOnly"),
    published: bool(fd, "published"),
    ...(file ? { mediaId: file.id } : {}),
  };
  if (!data.title) return { error: "Title is required." };
  const row = existing ? await db.resource.update({ where: { id: existing.id }, data }) : await db.resource.create({ data });
  await audit(user.id, existing ? "resource.update" : "resource.create", "Resource", row.id);
  revalidatePath("/resources");
  return { success: existing ? "Resource saved." : "Resource added.", ts: Date.now() };
});

export async function deleteResource(fd: FormData) {
  const r = await db.resource.findUniqueOrThrow({ where: { id: str(fd, "id") } });
  const user = await assertCan("partnerContent.manage", r.clubId);
  await db.resource.delete({ where: { id: r.id } });
  await audit(user.id, "resource.delete", "Resource", r.id, { title: r.title });
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}

/* ─── Galleries & media ───────────────────────────────────────────────── */

export const saveGallery = guarded(async (fd) => {
  const id = optStr(fd, "id");
  const clubId = optStr(fd, "clubId");
  const existing = id ? await db.gallery.findUniqueOrThrow({ where: { id } }) : null;
  const user = await canOnBoth("content.manage", existing ? existing.clubId : clubId, clubId);
  const data = { clubId, eventId: optStr(fd, "eventId"), title: str(fd, "title"), description: optStr(fd, "description"), published: bool(fd, "published") };
  if (!data.title) return { error: "Title is required." };
  const row = existing ? await db.gallery.update({ where: { id: existing.id }, data }) : await db.gallery.create({ data });
  await audit(user.id, existing ? "gallery.update" : "gallery.create", "Gallery", row.id);
  if (!existing) redirect(`/admin/galleries/${row.id}?created=1`);
});

export const uploadGalleryImages = guarded(async (fd) => {
  const g = await db.gallery.findUniqueOrThrow({ where: { id: str(fd, "galleryId") } });
  const user = await assertCan("content.manage", g.clubId);
  const files = fd.getAll("images").filter((f) => typeof f !== "string" && f.size > 0);
  if (!files.length) return { error: "Choose at least one image." };
  if (files.length > 30) return { error: "Upload at most 30 images at a time." };
  const caption = optStr(fd, "caption");
  let order = await db.galleryImage.count({ where: { galleryId: g.id } });
  for (const f of files) {
    const m = await storeUpload(f, { userId: user.id, clubId: g.clubId, accept: ["IMAGE"], alt: caption });
    if (m) await db.galleryImage.create({ data: { galleryId: g.id, mediaId: m.id, caption, sortOrder: order++ } });
  }
  await audit(user.id, "gallery.upload", "Gallery", g.id, { count: files.length });
  revalidatePath(`/admin/galleries/${g.id}`);
  return { success: `${files.length} image(s) uploaded.`, ts: Date.now() };
});

export async function updateGalleryImage(fd: FormData) {
  const im = await db.galleryImage.findUniqueOrThrow({ where: { id: str(fd, "id") }, include: { gallery: true } });
  await assertCan("content.manage", im.gallery.clubId);
  if (str(fd, "op") === "delete") await db.galleryImage.delete({ where: { id: im.id } });
  else await db.galleryImage.update({ where: { id: im.id }, data: { caption: optStr(fd, "caption") } });
  revalidatePath(`/admin/galleries/${im.galleryId}`);
}

export const uploadMedia = guarded(async (fd) => {
  const clubId = optStr(fd, "clubId");
  const user = await assertCan("content.manage", clubId);
  const m = await storeUpload(fd.get("file"), { userId: user.id, clubId, alt: optStr(fd, "alt") });
  if (!m) return { error: "Choose a file to upload." };
  await audit(user.id, "media.upload", "Media", m.id);
  revalidatePath("/admin/media");
  return { success: `Uploaded. URL: /api/media/${m.id}`, ts: Date.now() };
});

export async function deleteMedia(fd: FormData) {
  const m = await db.media.findUniqueOrThrow({ where: { id: str(fd, "id") } });
  const user = await assertCan("content.manage", m.clubId);
  await db.media.delete({ where: { id: m.id } });
  await deleteStoredFile(m.storageKey);
  await audit(user.id, "media.delete", "Media", m.id);
  revalidatePath("/admin/media");
}

/* ─── Impact ──────────────────────────────────────────────────────────── */

const METRIC_LABELS: Record<string, string> = {
  PEOPLE_IMPACTED: "People impacted",
  COMMUNITY_PROJECTS: "Community projects supported",
  VOLUNTEER_HOURS: "Volunteer hours (recorded)",
  MENTORSHIP_CONNECTIONS: "Mentorship connections",
  COACHES_TRAINED: "Members trained as coaches",
  PROFESSIONALS_REACHED: "Professionals reached",
  BENEFITS_SECURED: "Member benefits secured",
};

export const recordImpact = guarded(async (fd) => {
  const clubId = optStr(fd, "clubId");
  const user = await assertCan("club.edit", clubId);
  const metric = str(fd, "metric");
  const value = optFloat(fd, "value");
  if (value === null) return { error: "Enter a numeric value." };
  await db.impactMetric.create({
    data: { clubId, metric, label: optStr(fd, "label") ?? METRIC_LABELS[metric] ?? metric, value, period: optStr(fd, "period"), note: optStr(fd, "note") },
  });
  await audit(user.id, "impact.record", "ImpactMetric", null, { clubId, metric, value });
  revalidatePath("/impact");
  revalidatePath("/admin/impact");
  return { success: "Impact recorded.", ts: Date.now() };
});

export async function deleteImpact(fd: FormData) {
  const m = await db.impactMetric.findUniqueOrThrow({ where: { id: str(fd, "id") } });
  const user = await assertCan("club.edit", m.clubId);
  await db.impactMetric.delete({ where: { id: m.id } });
  await audit(user.id, "impact.delete", "ImpactMetric", m.id);
  revalidatePath("/admin/impact");
}

/* ─── Communications ──────────────────────────────────────────────────── */

export const sendAnnouncement = guarded(async (fd) => {
  const clubId = optStr(fd, "clubId");
  const user = await assertCan("communications.send", clubId);
  const title = str(fd, "title");
  const body = str(fd, "body");
  if (!title || !body) return { error: "Subject and message are required." };
  let link = optStr(fd, "link") ?? undefined;
  if (bool(fd, "alsoPost")) {
    const slug = await uniqueSlug(title, async (s) => !!(await db.post.findUnique({ where: { slug: s } })));
    await db.post.create({ data: { clubId, type: "ANNOUNCEMENT", title, body, excerpt: body.slice(0, 180), slug, authorId: user.id, published: true, publishedAt: new Date() } });
    link = `/news/${slug}`;
    revalidatePath("/news");
  }
  const count = await notifyClub(clubId, { title, body, link, kind: "ANNOUNCEMENT" }, "announcement", "Read more");
  await audit(user.id, "communications.announce", "Club", clubId, { title, recipients: count });
  return { success: `Announcement sent to ${count} member(s).`, ts: Date.now() };
});

/* ─── Settings ────────────────────────────────────────────────────────── */

export const saveSettings = guarded(async (fd) => {
  const admin = await chapterAdmin();
  for (const key of ["siteName", "tagline", "contactEmail", "whatsappPolicy"]) {
    await db.setting.upsert({ where: { key }, create: { key, value: str(fd, key) }, update: { value: str(fd, key) } });
  }
  await audit(admin.id, "settings.update", "Setting");
  return { success: "Settings saved." };
});
