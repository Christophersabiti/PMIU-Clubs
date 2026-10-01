import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, lines } from "@/lib/utils";
import { EventCard, ACTIVITY_TYPES } from "@/components/cards";
import { Badge, Card, Container, EmptyState, SectionHeading } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/activities/[id]">) {
  const { id } = await params;
  const a = await db.activity.findUnique({ where: { id } });
  return { title: a?.title ?? "Activity" };
}

export default async function ActivityPage({ params }: PageProps<"/activities/[id]">) {
  const { id } = await params;
  const a = await db.activity.findUnique({
    where: { id },
    include: { club: true, initiative: true, partner: true, events: { where: { status: { not: "DRAFT" } }, orderBy: { startsAt: "asc" }, include: { club: true } } },
  });
  if (!a) notFound();
  const user = await getCurrentUser();
  const regs = user ? new Set((await db.eventRegistration.findMany({ where: { userId: user.id, status: { not: "CANCELLED" } } })).map((r) => r.eventId)) : new Set<string>();
  const now = new Date();
  const upcoming = a.events.filter((e) => e.endsAt >= now);
  const past = a.events.filter((e) => e.endsAt < now);

  return (
    <>
      <section className="hero-bg text-white">
        <Container className="py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-brand-200">
            <Link href={`/clubs/${a.club.slug}`} className="hover:underline">{a.club.name}</Link>
            {a.initiative && <> / {a.initiative.title}</>}
          </nav>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="gold">{ACTIVITY_TYPES[a.type]}</Badge>
            {a.isVolunteer && <Badge tone="green">Volunteer · counts toward impact hours</Badge>}
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{a.title}</h1>
          {a.summary && <p className="mt-3 max-w-2xl text-lg text-brand-100">{a.summary}</p>}
          <p className="mt-3 text-sm text-brand-200">
            {a.startDate && <>From {formatDate(a.startDate)}</>}
            {a.endDate && <> to {formatDate(a.endDate)}</>}
            {a.partner && <> · with <Link href={`/partners/${a.partner.slug}`} className="underline">{a.partner.name}</Link></>}
          </p>
        </Container>
      </section>
      <Container className="space-y-10 py-10">
        {a.description && <Card><div className="prose-body">{lines(a.description).map((p, i) => <p key={i}>{p}</p>)}</div></Card>}
        <section>
          <SectionHeading title="Upcoming events" />
          {upcoming.length ? <div className="grid gap-3 md:grid-cols-2">{upcoming.map((e) => <EventCard key={e.id} event={e} registered={regs.has(e.id)} />)}</div> : <EmptyState title="No upcoming events for this activity" />}
        </section>
        {past.length > 0 && (
          <section>
            <SectionHeading title="Past events" />
            <div className="grid gap-3 md:grid-cols-2">{past.map((e) => <EventCard key={e.id} event={e} compact />)}</div>
          </section>
        )}
      </Container>
    </>
  );
}
