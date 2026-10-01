"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { esc } from "@/lib/mail";
import { storeUpload, UploadError } from "@/lib/upload";
import { bool, formatDateTime, optStr, safeNext, str } from "@/lib/utils";
import type { ActionState } from "@/components/forms";

function profileData(fd: FormData) {
  const isPmiMember = bool(fd, "isPmiMember");
  const linkedin = optStr(fd, "linkedin");
  if (linkedin && !/^https:\/\/(www\.)?linkedin\.com\//i.test(linkedin)) throw new UploadError("LinkedIn must be a https://linkedin.com/… URL.");
  return {
    name: str(fd, "name").slice(0, 100),
    phone: optStr(fd, "phone"),
    organization: optStr(fd, "organization"),
    jobTitle: optStr(fd, "jobTitle"),
    isPmiMember,
    pmiMemberId: isPmiMember ? optStr(fd, "pmiMemberId") : null,
    pmiChapter: isPmiMember ? optStr(fd, "pmiChapter") : null,
    certifications: optStr(fd, "certifications"),
    skills: optStr(fd, "skills"),
    interests: fd.getAll("interests").map(String).filter(Boolean).join(", ") || optStr(fd, "interestsText"),
    bio: optStr(fd, "bio")?.slice(0, 1500) ?? null,
    linkedin,
  };
}

export async function completeOnboarding(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    const data = profileData(fd);
    if (data.name.length < 2) return { error: "Please enter your name." };
    await db.user.update({ where: { id: user.id }, data: { ...data, profileCompleted: true } });
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  redirect(safeNext(str(fd, "next")));
}

export async function updateProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    const data = profileData(fd);
    if (data.name.length < 2) return { error: "Please enter your name." };
    const photo = await storeUpload(fd.get("photo"), { userId: user.id, accept: ["IMAGE"], alt: data.name });
    await db.user.update({
      where: { id: user.id },
      data: {
        ...data,
        profileCompleted: true,
        ...(photo ? { photoId: photo.id } : {}),
        showInDirectory: bool(fd, "showInDirectory"),
        showEmail: bool(fd, "showEmail"),
        showPhone: bool(fd, "showPhone"),
        showClubs: bool(fd, "showClubs"),
        showActivity: bool(fd, "showActivity"),
        emailOptIn: bool(fd, "emailOptIn"),
      },
    });
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { success: "Profile saved." };
}

export async function joinClub(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const clubId = str(fd, "clubId");
  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club || !club.active) return { error: "Club not found." };
  const user = await getCurrentUser();
  if (!user) redirect(`/register?next=${encodeURIComponent(`/clubs/${club.slug}/join`)}`);
  if (!user.profileCompleted) redirect(`/onboarding?next=${encodeURIComponent(`/clubs/${club.slug}/join`)}`);

  const existing = await db.clubMembership.findUnique({ where: { userId_clubId: { userId: user.id, clubId } } });
  if (existing?.status === "ACTIVE") return { success: "You are already a member of this club." };
  if (existing?.status === "PENDING") return { success: "Your request is awaiting approval." };

  const status = club.requiresApproval ? "PENDING" : "ACTIVE";
  const data = { status, motivation: optStr(fd, "motivation"), joinedAt: status === "ACTIVE" ? new Date() : null };
  await db.clubMembership.upsert({ where: { userId_clubId: { userId: user.id, clubId } }, create: { userId: user.id, clubId, ...data }, update: data });
  await audit(user.id, status === "ACTIVE" ? "club.join" : "club.request", "Club", clubId);

  if (status === "ACTIVE") {
    await notifyUser(
      user.id,
      { title: `Welcome to the ${club.name}!`, body: "Check out upcoming activities and events.", link: `/clubs/${club.slug}`, kind: "MEMBERSHIP" },
      {
        subject: `You joined ${club.name}`,
        html: `<p>You're now a member of <strong>${esc(club.name)}</strong>.</p>${club.whatsappUrl ? `<p>Join the club WhatsApp community for quick updates: <a href="${esc(club.whatsappUrl)}">${esc(club.whatsappUrl)}</a></p>` : ""}`,
        cta: "Open club",
        template: "club_joined",
      },
    );
  } else {
    await notifyUser(
      user.id,
      { title: `Request sent to ${club.name}`, body: "A club administrator will review your request.", link: `/clubs/${club.slug}`, kind: "MEMBERSHIP" },
      { subject: `Your request to join ${club.name}`, html: `<p>Thanks for your interest in <strong>${esc(club.name)}</strong>. A club administrator will review your request and you'll be notified.</p>`, cta: "View club", template: "membership_pending" },
    );
    // Alert everyone who can approve: the club's leads and the platform administrator(s)
    const approvers = await db.user.findMany({
      where: { OR: [{ globalRole: { in: ["SUPER_ADMIN", "CHAPTER_ADMIN"] } }, { clubRoles: { some: { clubId, role: "CLUB_LEAD" } } }] },
      select: { id: true },
    });
    for (const a of approvers) {
      await notifyUser(a.id, { title: `New join request: ${user.name}`, body: club.name, link: "/admin/applications", kind: "MEMBERSHIP" });
    }
  }
  revalidatePath(`/clubs/${club.slug}`);
  revalidatePath("/dashboard");
  if (str(fd, "redirect") === "1") redirect(`/clubs/${club.slug}?joined=${status === "ACTIVE" ? "1" : "pending"}`);
  return { success: status === "ACTIVE" ? "Welcome! You're now a member." : "Request sent — awaiting approval." };
}

export async function leaveClub(fd: FormData) {
  const user = await requireUser();
  const clubId = str(fd, "clubId");
  await db.clubMembership.updateMany({ where: { userId: user.id, clubId }, data: { status: "LEFT" } });
  await audit(user.id, "club.leave", "Club", clubId);
  revalidatePath("/dashboard");
  revalidatePath("/clubs", "layout");
}

const ticket = () => randomBytes(9).toString("base64url");

export async function registerForEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const eventId = str(fd, "eventId");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`);
  const event = await db.event.findUnique({ where: { id: eventId }, include: { club: true } });
  if (!event || event.status !== "PUBLISHED") return { error: "Registration is not available for this event." };
  if (event.startsAt < new Date()) return { error: "This event has already started." };
  if (event.registrationDeadline && event.registrationDeadline < new Date()) return { error: "Registration has closed for this event." };

  const existing = await db.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
  if (existing && existing.status !== "CANCELLED") return { success: "You're already registered." };

  const taken = await db.eventRegistration.count({ where: { eventId, status: "REGISTERED" } });
  const status = event.capacity != null && taken >= event.capacity ? "WAITLISTED" : "REGISTERED";
  const reg = existing
    ? await db.eventRegistration.update({ where: { id: existing.id }, data: { status } })
    : await db.eventRegistration.create({ data: { eventId, userId: user.id, status, ticketCode: ticket() } });
  await audit(user.id, `event.${status.toLowerCase()}`, "Event", eventId);

  await notifyUser(
    user.id,
    {
      title: status === "REGISTERED" ? `Registered: ${event.title}` : `Waitlisted: ${event.title}`,
      body: formatDateTime(event.startsAt),
      link: status === "REGISTERED" ? `/tickets/${reg.ticketCode}` : `/events/${event.id}`,
      kind: "EVENT",
    },
    {
      subject: status === "REGISTERED" ? `Registration confirmed — ${event.title}` : `You're on the waitlist — ${event.title}`,
      html:
        `<p><strong>${esc(event.title)}</strong><br>${esc(formatDateTime(event.startsAt))}${event.locationName ? `<br>${esc(event.locationName)}` : ""}</p>` +
        (status === "REGISTERED" ? "<p>Show your QR ticket at check-in.</p>" : "<p>We'll let you know if a place opens up.</p>"),
      cta: status === "REGISTERED" ? "View QR ticket" : "View event",
      template: "registration",
    },
  );
  revalidatePath(`/events/${eventId}`);
  return { success: status === "REGISTERED" ? "You're registered! Your QR ticket is ready." : "The event is full — you're on the waitlist." };
}

export async function cancelRegistration(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const eventId = str(fd, "eventId");
  const reg = await db.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId: user.id } }, include: { event: true } });
  if (!reg || reg.status === "CANCELLED") return { error: "No active registration found." };
  await db.eventRegistration.update({ where: { id: reg.id }, data: { status: "CANCELLED" } });
  await audit(user.id, "event.cancel_registration", "Event", eventId);
  // Promote first waitlisted member
  if (reg.status === "REGISTERED") {
    const next = await db.eventRegistration.findFirst({ where: { eventId, status: "WAITLISTED" }, orderBy: { updatedAt: "asc" } });
    if (next) {
      await db.eventRegistration.update({ where: { id: next.id }, data: { status: "REGISTERED" } });
      await notifyUser(
        next.userId,
        { title: `A place opened up: ${reg.event.title}`, body: "You've been moved from the waitlist.", link: `/tickets/${next.ticketCode}`, kind: "EVENT" },
        { subject: `You're in — ${reg.event.title}`, html: "<p>A place opened up and your registration is now confirmed.</p>", cta: "View QR ticket", template: "registration" },
      );
    }
  }
  revalidatePath(`/events/${eventId}`);
  return { success: "Your registration has been cancelled." };
}

export async function markAllRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}
