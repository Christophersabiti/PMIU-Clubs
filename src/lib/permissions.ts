import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./auth";

export const GLOBAL_ROLES = ["SUPER_ADMIN", "CHAPTER_ADMIN", "MEMBER"] as const;
export const CLUB_ROLES = ["CLUB_LEAD", "CONTENT_MANAGER", "EVENT_COORDINATOR", "PARTNER_REP"] as const;
export type ClubRoleName = (typeof CLUB_ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  CHAPTER_ADMIN: "PMI Chapter Admin",
  MEMBER: "Member",
  CLUB_LEAD: "Club Captain / Lead",
  CONTENT_MANAGER: "Content Manager",
  EVENT_COORDINATOR: "Event Coordinator",
  PARTNER_REP: "Partner Representative",
};

/**
 * Capabilities at club scope. Chapter/Super admins hold every capability on every club.
 * Example from the PRD: a Fitness Club Lead can modify Fitness but not Rotary.
 */
export type Capability =
  | "club.edit" // club profile, partners links, impact metrics
  | "members.manage" // approve join requests, remove members
  | "events.manage"
  | "attendance.manage"
  | "content.manage" // initiatives, activities, posts, galleries, resources
  | "partnerContent.manage" // resources and posts as a partner
  | "communications.send";

const MATRIX: Record<ClubRoleName, Capability[]> = {
  CLUB_LEAD: ["club.edit", "members.manage", "events.manage", "attendance.manage", "content.manage", "partnerContent.manage", "communications.send"],
  CONTENT_MANAGER: ["events.manage", "attendance.manage", "content.manage", "partnerContent.manage"],
  EVENT_COORDINATOR: ["events.manage", "attendance.manage"],
  PARTNER_REP: ["partnerContent.manage"],
};

export function isChapterAdmin(user: Pick<CurrentUser, "globalRole"> | null | undefined) {
  return user?.globalRole === "SUPER_ADMIN" || user?.globalRole === "CHAPTER_ADMIN";
}
export function isSuperAdmin(user: Pick<CurrentUser, "globalRole"> | null | undefined) {
  return user?.globalRole === "SUPER_ADMIN";
}

export function can(user: CurrentUser | null | undefined, cap: Capability, clubId: string | null | undefined) {
  if (!user) return false;
  if (isChapterAdmin(user)) return true;
  if (!clubId) return false; // chapter-wide content needs chapter admin
  return user.clubRoles.some((r) => r.clubId === clubId && MATRIX[r.role as ClubRoleName]?.includes(cap));
}

/** Club ids on which the user holds a capability; `null` means all clubs. */
export function clubsWith(user: CurrentUser, cap: Capability): string[] | null {
  if (isChapterAdmin(user)) return null;
  return [...new Set(user.clubRoles.filter((r) => MATRIX[r.role as ClubRoleName]?.includes(cap)).map((r) => r.clubId))];
}

export function hasAdminAccess(user: CurrentUser | null | undefined) {
  return !!user && (isChapterAdmin(user) || user.clubRoles.length > 0);
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!hasAdminAccess(user)) redirect("/dashboard?denied=1");
  return user;
}

export async function requireChapterAdmin() {
  const user = await requireAdmin();
  if (!isChapterAdmin(user)) redirect("/admin?denied=1");
  return user;
}

/** Use inside server actions: throws if not permitted. */
export async function assertCan(cap: Capability, clubId: string | null | undefined) {
  const user = await getCurrentUser();
  if (!user || !can(user, cap, clubId)) throw new Error("You do not have permission to perform this action.");
  return user;
}

/** Prisma `where` fragment limiting rows to clubs the user may manage. */
export function clubScope(user: CurrentUser, cap: Capability) {
  const ids = clubsWith(user, cap);
  return ids === null ? {} : { clubId: { in: ids } };
}

/** Clubs the user may act on for a capability (for <select> options). */
export async function manageableClubs(user: CurrentUser, cap: Capability) {
  const { db } = await import("./db");
  const ids = clubsWith(user, cap);
  return db.club.findMany({ where: ids === null ? {} : { id: { in: ids } }, orderBy: { sortOrder: "asc" }, select: { id: true, shortName: true, name: true } });
}
