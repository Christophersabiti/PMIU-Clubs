import { db } from "@/lib/db";
import { manageableClubs } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/auth";

export async function programmeOptions(user: CurrentUser, cap: "content.manage" | "events.manage") {
  const clubs = await manageableClubs(user, cap);
  const ids = clubs.map((c) => c.id);
  const [initiatives, activities, partners] = await Promise.all([
    db.initiative.findMany({ where: { clubId: { in: ids } }, include: { club: true }, orderBy: { title: "asc" } }),
    db.activity.findMany({ where: { clubId: { in: ids } }, include: { club: true }, orderBy: { title: "asc" } }),
    db.partner.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    clubs: clubs.map((c) => ({ id: c.id, label: c.shortName })),
    initiatives: initiatives.map((i) => ({ id: i.id, clubId: i.clubId, label: `${i.club.shortName} · ${i.title}` })),
    activities: activities.map((a) => ({ id: a.id, clubId: a.clubId, label: `${a.club.shortName} · ${a.title}` })),
    partners: partners.map((p) => ({ id: p.id, label: p.name })),
  };
}
