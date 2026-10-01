import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ActivityCard, EventCard, PostCard, ResourceItem } from "@/components/cards";
import { FilterBar } from "@/components/FilterBar";
import { Container, EmptyState, PageHeader, SectionHeading } from "@/components/ui";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const q = (sp.q ?? "").trim();
  const clubs = await db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const clubWhere = sp.club ? { club: { slug: sp.club } } : {};
  const show = (t: string) => !sp.type || sp.type === t;
  const user = await getCurrentUser();

  const results = q
    ? await Promise.all([
        show("clubs") && !sp.club ? db.club.findMany({ where: { active: true, OR: [{ name: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }, { focus: { contains: q, mode: "insensitive" } }] } }) : [],
        show("activities") ? db.activity.findMany({ where: { ...clubWhere, OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }] }, include: { club: true, initiative: true }, take: 12 }) : [],
        show("events")
          ? db.event.findMany({
              where: { ...clubWhere, status: { not: "DRAFT" }, ...(sp.mode ? { mode: sp.mode } : {}), OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }, { locationName: { contains: q, mode: "insensitive" } }, { facilitator: { contains: q, mode: "insensitive" } }] },
              include: { club: true }, orderBy: { startsAt: "desc" }, take: 12,
            })
          : [],
        show("resources") ? db.resource.findMany({ where: { ...clubWhere, published: true, ...(user ? {} : { membersOnly: false }), OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }, include: { club: true, partner: true }, take: 12 }) : [],
        show("partners") && !sp.club ? db.partner.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { expertise: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } }) : [],
        show("news") ? db.post.findMany({ where: { ...clubWhere, published: true, OR: [{ title: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }] }, include: { club: true }, take: 9 }) : [],
      ])
    : null;
  const total = results?.reduce((s, r) => s + r.length, 0) ?? 0;

  return (
    <>
      <PageHeader title="Search" intro="Search clubs, activities, events, resources, partners and news." />
      <Container className="py-10">
        <FilterBar action="/search" q={q} placeholder="e.g. coaching, Kololo, safety" filters={[
          { name: "type", label: "Show", value: sp.type, options: ["clubs", "activities", "events", "resources", "partners", "news"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { name: "club", label: "Club", value: sp.club, options: clubs.map((c) => ({ value: c.slug, label: c.shortName })) },
          { name: "mode", label: "Online/Physical", value: sp.mode, options: [{ value: "PHYSICAL", label: "In person" }, { value: "ONLINE", label: "Online" }, { value: "HYBRID", label: "Hybrid" }] },
        ]} />
        {results === null ? (
          <p className="mt-8 text-muted">Type a search term to begin.</p>
        ) : total === 0 ? (
          <div className="mt-8"><EmptyState title={`No results for “${q}”`}>Try a different word or remove filters.</EmptyState></div>
        ) : (
          <div className="mt-8 space-y-10" aria-live="polite">
            <p className="text-sm text-muted">{total} results for “{q}”</p>
            {results[0].length > 0 && <section><SectionHeading title="Clubs" /><ul className="grid gap-2">{results[0].map((c) => <li key={c.id}><Link href={`/clubs/${c.slug}`} className="font-semibold text-brand-700 underline">{c.name}</Link> — <span className="text-sm text-muted">{c.summary}</span></li>)}</ul></section>}
            {results[1].length > 0 && <section><SectionHeading title="Activities" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results[1].map((a) => <ActivityCard key={a.id} activity={a} />)}</div></section>}
            {results[2].length > 0 && <section><SectionHeading title="Events" /><div className="grid gap-3 md:grid-cols-2">{results[2].map((e) => <EventCard key={e.id} event={e} />)}</div></section>}
            {results[3].length > 0 && <section><SectionHeading title="Resources" /><ul className="grid gap-3 md:grid-cols-2">{results[3].map((r) => <ResourceItem key={r.id} resource={r} />)}</ul></section>}
            {results[4].length > 0 && <section><SectionHeading title="Partners" /><ul className="grid gap-2">{results[4].map((p) => <li key={p.id}><Link href={`/partners/${p.slug}`} className="font-semibold text-brand-700 underline">{p.name}</Link></li>)}</ul></section>}
            {results[5].length > 0 && <section><SectionHeading title="News" /><div className="grid gap-4 md:grid-cols-3">{results[5].map((p) => <PostCard key={p.id} post={p} />)}</div></section>}
          </div>
        )}
      </Container>
    </>
  );
}
