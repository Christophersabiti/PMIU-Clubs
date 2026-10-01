import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { lines } from "@/lib/utils";
import { ActivityCard, EventCard, ResourceItem } from "@/components/cards";
import { Badge, Card, Container, EmptyState, SectionHeading, btn } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/partners/[slug]">) {
  const { slug } = await params;
  const p = await db.partner.findUnique({ where: { slug } });
  return { title: p?.name ?? "Partner" };
}

export default async function PartnerPage({ params }: PageProps<"/partners/[slug]">) {
  const { slug } = await params;
  const now = new Date();
  const p = await db.partner.findUnique({
    where: { slug },
    include: {
      clubs: { include: { club: true } },
      activities: { include: { club: true, initiative: true } },
      events: { where: { status: "PUBLISHED", endsAt: { gte: now } }, include: { club: true }, orderBy: { startsAt: "asc" } },
      resources: { where: { published: true }, include: { club: true, partner: true } },
    },
  });
  if (!p) notFound();
  return (
    <>
      <section className="hero-bg text-white">
        <Container className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Partner of {p.clubs.map((c) => c.club.name).join(" · ")}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{p.name}</h1>
          {p.status === "PROSPECT" && <Badge tone="gold" className="mt-3">Partnership being confirmed</Badge>}
          <p className="mt-3 max-w-2xl text-lg text-brand-100">{p.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {p.website && <a href={p.website} target="_blank" rel="noreferrer" className={`${btn.base} ${btn.gold}`}>Visit partner <ExternalLink className="h-4 w-4" aria-hidden /></a>}
            {p.contactEmail && <a href={`mailto:${p.contactEmail}`} className={`${btn.base} ${btn.light}`}><Mail className="h-4 w-4" aria-hidden />Contact</a>}
          </div>
        </Container>
      </section>
      <Container className="space-y-10 py-10">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <h2 className="font-display text-xl font-semibold">Expertise</h2>
            <ul className="mt-3 flex flex-wrap gap-2">{lines(p.expertise).map((e) => <li key={e}><Badge tone="brand" className="text-sm">{e}</Badge></li>)}</ul>
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold">With PMI Uganda</h2>
            <ul className="mt-3 space-y-3">
              {p.clubs.map((c) => (
                <li key={c.id} className="text-sm">
                  <Link href={`/clubs/${c.club.slug}`} className="font-semibold text-brand-700 underline">{c.club.name}</Link>
                  {c.provides && <p><span className="font-medium">Provides:</span> {c.provides}</p>}
                  {c.memberBenefit && <p><span className="font-medium">Member benefit:</span> {c.memberBenefit}</p>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <section>
          <SectionHeading title="Associated activities" />
          {p.activities.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{p.activities.map((a) => <ActivityCard key={a.id} activity={a} />)}</div> : <EmptyState title="No activities yet" />}
        </section>
        {p.events.length > 0 && (
          <section>
            <SectionHeading title="Upcoming events" />
            <div className="grid gap-3 md:grid-cols-2">{p.events.map((e) => <EventCard key={e.id} event={e} />)}</div>
          </section>
        )}
        {p.resources.length > 0 && (
          <section>
            <SectionHeading title="Partner resources" />
            <ul className="grid gap-3">{p.resources.map((r) => <ResourceItem key={r.id} resource={r} />)}</ul>
          </section>
        )}
      </Container>
    </>
  );
}
