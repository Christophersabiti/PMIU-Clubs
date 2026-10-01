import Link from "next/link";
import { ArrowRight, CalendarCheck, Handshake, MessageCircle, Target, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { impactSummary } from "@/lib/stats";
import { ClubCard, EventCard, PostCard } from "@/components/cards";
import { ButtonLink, Container, SectionHeading, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const now = new Date();
  const [clubs, events, posts, partners, impact, myClubIds] = await Promise.all([
    db.club.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { memberships: { where: { status: "ACTIVE" } } } } } }),
    db.event.findMany({ where: { status: "PUBLISHED", endsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 4, include: { club: true } }),
    db.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 3, include: { club: true } }),
    db.partner.findMany({ where: { status: { in: ["ACTIVE", "PROSPECT"] } }, include: { clubs: { include: { club: true } } } }),
    impactSummary(),
    user ? db.clubMembership.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { clubId: true } }) : [],
  ]);
  const joined = new Set(myClubIds.map((m) => m.clubId));
  const photos = ["toastmasters", "fitness", "coaching", "health-safety", "rotary", "community"];

  return (
    <>
      {/* Hero */}
      <section className="hero-bg relative overflow-hidden text-white">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="inline-flex rounded-full border border-gold-400/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
              Launched 1 October 2026 · 2026 pilot
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] text-brand-300 sm:text-7xl">
              PMI Uganda <span className="block text-white">Clubs</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100 sm:text-xl">
              Beyond Project Management. <span className="font-semibold text-gold-400">Connect, Grow, Lead and Create Impact</span> — through five strategic clubs
              delivered with partners who bring the skills.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/clubs" variant="gold">
                Explore Clubs <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              {user ? (
                <ButtonLink href="/dashboard" variant="light">Go to My Clubs</ButtonLink>
              ) : (
                <ButtonLink href="/register" variant="light">Sign In / Join a Club</ButtonLink>
              )}
            </div>
            <p className="mt-8 text-sm text-brand-200">
              Grow your skills in <span className="font-semibold text-white">Speaking · Fitness · Coaching · Safety · Community impact</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4" aria-hidden>
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p}
                src={`/images/clubs/${p}.jpg`}
                alt=""
                className={`aspect-square w-full rounded-full object-cover ring-4 ring-white/15 ${i % 2 ? "translate-y-6" : ""}`}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Concept */}
      <section className="border-b border-brand-100 bg-white">
        <Container className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-5 text-center text-sm font-semibold text-brand-800">
          {["Vision", "PMI Uganda Members", "Partner Expertise", "Practical Activities"].map((p, i) => (
            <span key={p} className="flex items-center gap-3">
              {i > 0 && <span className="text-gold-500">+</span>}
              {p}
            </span>
          ))}
          <span className="text-gold-500">=</span>
          <span className="rounded-full bg-brand-700 px-3 py-1 text-white">Community Impact</span>
        </Container>
      </section>

      {/* Clubs */}
      <Container className="py-14">
        <SectionHeading
          title="Five clubs. One platform."
          subtitle="One account lets you join as many clubs as you like."
          action={<ButtonLink href="/clubs" variant="outline" size="sm">All clubs</ButtonLink>}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <ClubCard key={c.id} club={c} memberCount={c._count.memberships} joined={joined.has(c.id)} />
          ))}
          <div className="flex flex-col justify-center rounded-3xl bg-brand-900 p-6 text-white">
            <p className="font-display text-2xl font-semibold text-gold-400">What can I participate in today?</p>
            <p className="mt-2 text-sm text-brand-100">Browse every activity and event across all clubs, filtered by date, club, partner or format.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href="/activities" variant="gold" size="sm">Activities</ButtonLink>
              <ButtonLink href="/events" variant="light" size="sm">Events</ButtonLink>
            </div>
          </div>
        </div>
      </Container>

      {/* Events */}
      <section className="bg-brand-50/60">
        <Container className="py-14">
          <SectionHeading title="Upcoming events" action={<ButtonLink href="/events" variant="outline" size="sm">Full calendar</ButtonLink>} />
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </Container>
      </section>

      {/* Impact */}
      <section className="hero-bg text-white">
        <Container className="py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Community impact</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Not just attendance — measurable impact.</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Stat tone="dark" value={impact.participants} label="Club participants" />
            <Stat tone="dark" value={impact.activities} label="Activities" />
            <Stat tone="dark" value={impact.communityProjects} label="Community projects" />
            <Stat tone="dark" value={impact.volunteerHours} label="Volunteer hours" />
            <Stat tone="dark" value={impact.partners} label="Strategic partners" />
            <Stat tone="dark" value={impact.peopleImpacted} label="People impacted" />
          </div>
          <ButtonLink href="/impact" variant="gold" className="mt-8">See the impact dashboard</ButtonLink>
        </Container>
      </section>

      {/* How clubs operate */}
      <Container className="py-14">
        <SectionHeading title="How every club operates" subtitle="One model, applied consistently across all clubs." />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: UserRound, t: "Club Captain", d: "Mobilises members, coordinates the partner, runs the calendar and reports to VP Events." },
            { icon: MessageCircle, t: "WhatsApp community", d: "Announcements, mobilisation, challenges and reminders. The platform stays the source of truth." },
            { icon: Handshake, t: "Partner", d: "What each side provides, member benefits and joint activities." },
            { icon: CalendarCheck, t: "Activity calendar", d: "A simple Oct–Dec 2026 plan for every club." },
            { icon: Target, t: "Measurement", d: "Members engaged, activities completed, benefits secured and community impact." },
          ].map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg text-gold-500">0{i + 1}</span>
                <Icon className="h-5 w-5 text-brand-600" aria-hidden />
              </div>
              <p className="mt-2 font-semibold text-brand-950">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </Container>

      {/* Partners */}
      <section className="bg-white">
        <Container className="py-14">
          <SectionHeading title="Our partners" subtitle="Organisations that bring complementary expertise to each club." action={<ButtonLink href="/partners" variant="outline" size="sm">All partners</ButtonLink>} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {partners.map((p) => (
              <li key={p.id} className="relative rounded-2xl border border-brand-100 p-4 hover:border-brand-300">
                <Link href={`/partners/${p.slug}`} className="font-semibold text-brand-950 after:absolute after:inset-0">{p.name}</Link>
                <p className="mt-1 text-xs text-muted">{p.clubs.map((c) => c.club.shortName).join(", ")}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* News */}
      <Container className="py-14">
        <SectionHeading title="Latest updates" action={<ButtonLink href="/news" variant="outline" size="sm">All news</ButtonLink>} />
        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </Container>
    </>
  );
}
