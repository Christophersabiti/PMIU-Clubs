import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ActivityCard, ACTIVITY_TYPES } from "@/components/cards";
import { FilterBar } from "@/components/FilterBar";
import { Container, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Activities" };

export default async function ActivitiesPage({ searchParams }: PageProps<"/activities">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const where: Prisma.ActivityWhereInput = {};
  if (sp.club) where.club = { slug: sp.club };
  if (sp.type) where.type = sp.type;
  if (sp.status) where.status = sp.status;
  if (sp.partner) where.partner = { slug: sp.partner };
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, { summary: { contains: sp.q, mode: "insensitive" } }];
  const [activities, clubs, partners] = await Promise.all([
    db.activity.findMany({ where, include: { club: true, initiative: true }, orderBy: [{ status: "asc" }, { startDate: "asc" }] }),
    db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.partner.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Practical activities" title="Activities" intro="Programmes, challenges, trainings and community projects that members take part in. Each activity can include scheduled events." />
      <Container className="py-10">
        <FilterBar
          action="/activities"
          q={sp.q ?? ""}
          filters={[
            { name: "club", label: "Club", value: sp.club, options: clubs.map((c) => ({ value: c.slug, label: c.shortName })) },
            { name: "type", label: "Type", value: sp.type, options: Object.entries(ACTIVITY_TYPES).map(([value, label]) => ({ value, label })) },
            { name: "status", label: "Status", value: sp.status, options: [{ value: "ACTIVE", label: "Active now" }, { value: "PLANNED", label: "Upcoming" }, { value: "COMPLETED", label: "Completed" }] },
            { name: "partner", label: "Partner", value: sp.partner, options: partners.map((p) => ({ value: p.slug, label: p.name })) },
          ]}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => <ActivityCard key={a.id} activity={a} />)}
        </div>
        {activities.length === 0 && <EmptyState title="No activities match these filters" />}
      </Container>
    </>
  );
}
