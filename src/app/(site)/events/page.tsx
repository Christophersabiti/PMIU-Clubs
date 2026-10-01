import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDay } from "@/lib/utils";
import { EventCard } from "@/components/cards";
import { FilterBar } from "@/components/FilterBar";
import { Container, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Events" };

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const now = new Date();
  const when = sp.when ?? "upcoming";
  const where: Prisma.EventWhereInput = { status: { in: ["PUBLISHED", "CANCELLED"] } };
  if (sp.club) where.club = { slug: sp.club };
  if (sp.mode) where.mode = sp.mode;
  if (sp.partner) where.partner = { slug: sp.partner };
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, { summary: { contains: sp.q, mode: "insensitive" } }, { locationName: { contains: sp.q, mode: "insensitive" } }];
  if (when === "upcoming") where.endsAt = { gte: now };
  else if (when === "past") where.endsAt = { lt: now };
  else if (/^\d{4}-\d{2}$/.test(when)) {
    const start = new Date(`${when}-01T00:00:00+03:00`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    where.startsAt = { gte: start, lt: end };
  }

  const user = await getCurrentUser();
  const [events, clubs, partners, regs] = await Promise.all([
    db.event.findMany({ where, orderBy: { startsAt: when === "past" ? "desc" : "asc" }, include: { club: true }, take: 100 }),
    db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.partner.findMany({ orderBy: { name: "asc" } }),
    user ? db.eventRegistration.findMany({ where: { userId: user.id, status: { not: "CANCELLED" } } }) : [],
  ]);
  const registered = new Set(regs.map((r) => r.eventId));

  // group by day for a calendar-like agenda
  const groups = new Map<string, typeof events>();
  for (const e of events) {
    const k = formatDay(e.startsAt);
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  const months = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en-GB", { month: "long", year: "numeric" }) };
  });

  return (
    <>
      <PageHeader eyebrow="Calendar" title="Events" intro="Scheduled sessions, runs, workshops and community days across every PMI Uganda club." />
      <Container className="py-10">
        <FilterBar
          action="/events"
          q={sp.q ?? ""}
          placeholder="Search events or locations"
          filters={[
            { name: "when", label: "Date", value: sp.when, options: [{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }, ...months] },
            { name: "club", label: "Club", value: sp.club, options: clubs.map((c) => ({ value: c.slug, label: c.shortName })) },
            { name: "mode", label: "Format", value: sp.mode, options: [{ value: "PHYSICAL", label: "In person" }, { value: "ONLINE", label: "Online" }, { value: "HYBRID", label: "Hybrid" }] },
            { name: "partner", label: "Partner", value: sp.partner, options: partners.map((p) => ({ value: p.slug, label: p.name })) },
          ]}
        />
        <div className="mt-8 space-y-8">
          {events.length === 0 && <EmptyState title="No events match these filters" />}
          {[...groups.entries()].map(([day, list]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">{day}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((e) => <EventCard key={e.id} event={e} registered={registered.has(e.id)} />)}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
