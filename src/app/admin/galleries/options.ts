import { db } from "@/lib/db";
import { manageableClubs } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/auth";

export async function galleryOptions(user: CurrentUser) {
  const clubs = await manageableClubs(user, "content.manage");
  const events = await db.event.findMany({ where: { clubId: { in: clubs.map((c) => c.id) } }, include: { club: true }, orderBy: { startsAt: "desc" }, take: 100 });
  return { clubs, events: events.map((e) => ({ id: e.id, label: `${e.club.shortName} · ${e.title}` })) };
}
